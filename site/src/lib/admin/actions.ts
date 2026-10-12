"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { formI18n } from "@/i18n/action";
import { toLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt, plural } from "@/i18n/format";
import { formatDate, pragueIsoDay } from "@/lib/format";
import { mailEnabled, sendEntryDecisionMail, type EntryMailKind } from "@/lib/mail";
import { PATHS } from "@/lib/portal/paths";
import { requireRole } from "@/lib/portal/session";
import { DEFAULT_MAX_ROSTER } from "@/lib/portal/types";
import { fail, ok, checkbox, text, type FormState } from "@/lib/portal/validation";
import { revalidateRoute } from "@/lib/revalidate";
import type { EntryStatus, TournamentStatus, TournamentWrite } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { intOrNull, pragueLocalToIso, slugify, textOrNull } from "./helpers";

// Zápisy organizátora. Každá akce nejdřív ověří roli admin, ale skutečnou
// ochranu drží databáze (RLS) — kdyby se kontrola někdy obešla, zápis stejně
// neprojde nikomu jiného než adminovi. Hlášky jsou v jazyce formuláře.

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Změna se projeví na veřejném webu, v přihlášce týmu i v portálu — ve všech jazycích. */
function refreshEverything() {
  revalidateRoute("/");
  revalidateRoute("/turnaje");
  revalidateRoute("/turnaje/[slug]");
  revalidateRoute(PATHS.teamRegistration);
  revalidateRoute(PATHS.portal, "layout");
}

async function adminClient(locale: Locale) {
  await requireRole("admin", locale);
  return createClient();
}

function dbFailure(
  error: PostgrestError,
  t: Dictionary,
  errors: Record<string, string> = {},
  values?: Record<string, string>
) {
  const m = t.adminActions;
  const constraint = error.message.match(/constraint "([^"]+)"/)?.[1];

  if (error.code === "23505" && constraint === "tournaments_slug_key") {
    return fail(t.actions.checkFields, { ...errors, slug: m.slugTaken }, values);
  }
  if (error.code === "23505" && constraint === "tournaments_single_open_registration") {
    return fail(m.singleOpen, errors, values);
  }
  if (error.code === "23514" && constraint === "tournaments_check") {
    return fail(m.completedOpen, errors, values);
  }
  if (error.code === "23514" && constraint === "tournaments_roster_range") {
    return fail(m.rosterRange, { ...errors, maxRoster: m.maxBelowMin }, values);
  }
  if (error.code === "23503") {
    return fail(m.hasDependents, errors, values);
  }
  if (error.message.includes("match_team_not_approved")) return fail(m.teamNotApproved, errors, values);
  if (error.message.includes("kickoff_before_tournament")) return fail(m.kickoffBeforeDay, errors, values);
  if (error.message.includes("match_has_events")) return fail(m.matchHasEvents, errors, values);
  if (error.message.includes("entry_has_matches")) return fail(m.entryHasMatches, errors, values);
  if (error.code === "42501") return fail(t.actions.forbidden, errors, values);
  // Web je novější než databáze: chybí migrace 20261013120000 (sloupec max_roster).
  if (error.message.includes("max_roster")) return fail(m.migrationMissing, errors, values);

  console.error("[admin]", error.code, error.message);
  return fail(t.actions.saveFailed, errors, values);
}

/* -------------------------------------------------------------------------- */
/*  Přihlášky týmů                                                            */
/* -------------------------------------------------------------------------- */

const ENTRY_STATUSES: EntryStatus[] = ["pending", "approved", "rejected"];

/** Web je novější než databáze: chybí migrace č. 8 (funkce pro stav přihlášky). */
function missingFunction(error: PostgrestError): boolean {
  return error.code === "PGRST202" || error.code === "42883";
}

/** Chyby funkcí admin_set_entry_status / admin_remove_entry → hláška pro organizátora. */
function entryFailure(error: PostgrestError, t: Dictionary, locale: Locale, values?: Record<string, string>) {
  const m = t.adminActions;
  const matches = error.message.match(/entry_has_matches:(\d+)/);
  if (matches) return fail(plural(locale, Number(matches[1]), m.entryHasMatchesN), {}, values);
  if (error.message.includes("entry_has_results")) return fail(m.entryHasResults, {}, values);
  if (error.message.includes("entry_not_found")) return fail(m.entryMissing, {}, values);
  if (error.message.includes("invalid_status")) return fail(m.invalidEntryStatus, {}, values);
  if (missingFunction(error)) return fail(m.migration8Missing, {}, values);
  return dbFailure(error, t, {}, values);
}

/**
 * E-mail kapitánovi o rozhodnutí (jen když je nastavený Resend). V portálu se
 * kapitán dozví vždycky — oznámení zakládá databáze sama.
 */
async function mailCaptain(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  teamId: string,
  kind: EntryMailKind,
  reason?: string
): Promise<boolean> {
  if (!mailEnabled()) return false;
  const [team, tournament] = await Promise.all([
    supabase.from("teams").select("name, owner_id").eq("id", teamId).maybeSingle(),
    supabase.from("tournaments").select("name, starts_on").eq("id", tournamentId).maybeSingle(),
  ]);
  if (!team.data?.owner_id || !tournament.data) return false;
  const { data: owner } = await supabase.from("profiles").select("*").eq("id", team.data.owner_id).maybeSingle();
  if (!owner?.email) return false;
  return sendEntryDecisionMail({
    kind,
    to: owner.email,
    locale: toLocale(owner.locale),
    name: owner.full_name,
    team: team.data.name,
    tournament: tournament.data.name,
    startsOn: tournament.data.starts_on,
    reason,
  });
}

/** „Kapitán to uvidí v portálu (a dostal e-mail).“ + kolik zápasů týmu zmizelo. */
function decisionMessage(base: string, deleted: number, mailed: boolean, t: Dictionary, locale: Locale): string {
  const m = t.adminActions;
  return [base, deleted > 0 ? plural(locale, deleted, m.matchesDeleted) : "", mailed ? m.captainMailed : m.captainNotified]
    .filter(Boolean)
    .join(" ");
}

/**
 * Schválit / zamítnout / vrátit ke schválení. Zamítnutí nese důvod pro
 * kapitána. Když má tým v rozpisu zápasy, formulář musí výslovně potvrdit
 * jejich smazání (deleteMatches) — jinak databáze změnu nepustí.
 */
export async function setEntryStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const m = t.adminActions;
  const supabase = await adminClient(locale);
  const tournamentId = text(formData, "tournamentId");
  const teamId = text(formData, "teamId");
  const status = text(formData, "status") as EntryStatus;
  if (!ENTRY_STATUSES.includes(status)) return fail(m.invalidEntryStatus);

  const note = status === "rejected" ? text(formData, "note") : "";
  const values = { note };
  if (note.length > 500) return fail(t.actions.checkFields, { note: m.noteLong }, values);

  const { data: deleted, error } = await supabase.rpc("admin_set_entry_status", {
    p_tournament: tournamentId,
    p_team: teamId,
    p_status: status,
    p_note: note,
    p_delete_matches: checkbox(formData, "deleteMatches"),
  });

  if (error && missingFunction(error) && status !== "rejected") {
    // Databáze bez migrace č. 8: schválit a vrátit jde i postaru (bez oznámení).
    const { data, error: updateError } = await supabase
      .from("tournament_entries")
      .update({ status })
      .eq("tournament_id", tournamentId)
      .eq("team_id", teamId)
      .select("team_id");
    if (updateError) return entryFailure(updateError, t, locale, values);
    if (data.length === 0) return fail(m.entryMissing);
    refreshEverything();
    return ok(status === "approved" ? m.entryApproved : m.entryPending);
  }
  if (error) return entryFailure(error, t, locale, values);

  const kind: EntryMailKind = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "returned";
  const mailed = await mailCaptain(supabase, tournamentId, teamId, kind, note);

  refreshEverything();
  const base = status === "approved" ? m.entryApproved : status === "rejected" ? m.entryRejected : m.entryPending;
  return ok(decisionMessage(base, deleted ?? 0, mailed, t, locale));
}

/**
 * Smazání přihlášky (jen u zamítnuté — tým se pak může přihlásit znovu).
 * Zápasy týmu stejně jako u změny stavu: jen s výslovným potvrzením.
 */
export async function removeEntryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const m = t.adminActions;
  const supabase = await adminClient(locale);
  const tournamentId = text(formData, "tournamentId");
  const teamId = text(formData, "teamId");

  const { data: deleted, error } = await supabase.rpc("admin_remove_entry", {
    p_tournament: tournamentId,
    p_team: teamId,
    p_delete_matches: checkbox(formData, "deleteMatches"),
  });
  if (error) return entryFailure(error, t, locale);

  const mailed = await mailCaptain(supabase, tournamentId, teamId, "removed");
  refreshEverything();
  return ok(decisionMessage(m.entryRemoved, deleted ?? 0, mailed, t, locale));
}

/* -------------------------------------------------------------------------- */
/*  Turnaje                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveTournamentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t, href } = formI18n(formData);
  const m = t.adminActions;
  const supabase = await adminClient(locale);

  const id = text(formData, "id");
  const values = {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    edition: text(formData, "edition"),
    startsOn: text(formData, "startsOn"),
    venue: text(formData, "venue"),
    format: text(formData, "format"),
    matchLength: text(formData, "matchLength"),
    summary: text(formData, "summary"),
    minRoster: text(formData, "minRoster") || "6",
    maxRoster: text(formData, "maxRoster") || String(DEFAULT_MAX_ROSTER),
    status: text(formData, "status") || "upcoming",
    registrationOpen: checkbox(formData, "registrationOpen") ? "on" : "",
  };

  const errors: Record<string, string> = {};
  if (!values.name) errors.name = m.nameMissing;
  else if (values.name.length > 80) errors.name = m.nameLong;

  const slug = values.slug || slugify(values.name);
  if (!slug || !SLUG_RE.test(slug)) errors.slug = m.slugInvalid;

  if (!DATE_RE.test(values.startsOn) || Number.isNaN(Date.parse(values.startsOn))) {
    errors.startsOn = m.dateMissing;
  }

  const minRoster = Number(values.minRoster);
  if (!Number.isInteger(minRoster) || minRoster < 1 || minRoster > 30) {
    errors.minRoster = m.rosterNumber;
  }
  const maxRoster = Number(values.maxRoster);
  if (!Number.isInteger(maxRoster) || maxRoster < 1 || maxRoster > 30) {
    errors.maxRoster = m.rosterNumber;
  } else if (!errors.minRoster && maxRoster < minRoster) {
    errors.maxRoster = m.maxBelowMin;
  }
  const status: TournamentStatus | null =
    values.status === "completed" || values.status === "upcoming" ? values.status : null;
  if (!status) errors.status = m.statusMissing;
  if (values.summary.length > 600) errors.summary = m.summaryLong;

  if (Object.keys(errors).length > 0 || !status) return fail(t.actions.checkFields, errors, values);

  // Odehraný turnaj nemůže přijímat přihlášky.
  const registrationOpen = values.registrationOpen === "on" && status === "upcoming";

  // Přihlášky smí být otevřené jen na jeden turnaj — ostatní nejdřív zavřeme
  // a organizátorovi to řekneme (jinak by se o tom nedozvěděl).
  const notes: string[] = [];
  if (registrationOpen) {
    let open = supabase.from("tournaments").select("name").eq("registration_open", true);
    if (id) open = open.neq("id", id);
    const { data: others } = await open;
    let close = supabase.from("tournaments").update({ registration_open: false }).eq("registration_open", true);
    if (id) close = close.neq("id", id);
    const { error } = await close;
    if (error) return dbFailure(error, t, {}, values);
    for (const other of others ?? []) notes.push(fmt(m.closedOther, { name: other.name }));
  }

  const row: TournamentWrite = {
    slug,
    name: values.name,
    edition: values.edition,
    starts_on: values.startsOn,
    venue: values.venue,
    format: values.format,
    match_length: values.matchLength,
    summary: values.summary,
    min_roster: minRoster,
    max_roster: maxRoster,
    status,
    registration_open: registrationOpen,
  };

  if (!id) {
    const { data, error } = await supabase.from("tournaments").insert(row).select("id").single();
    if (error) return dbFailure(error, t, {}, values);
    refreshEverything();
    redirect(href(`${PATHS.portal}/turnaje/${data.id}`));
  }

  const { data, error } = await supabase.from("tournaments").update(row).eq("id", id).select("id");
  if (error) return dbFailure(error, t, {}, values);
  if (data.length === 0) return fail(m.tournamentMissing);

  if (values.registrationOpen === "on" && !registrationOpen) notes.push(m.keptClosed.trim());

  // Zápasy, které po změně data turnaje leží v jiný den (svítí v rozpisu).
  const { data: matches } = await supabase.from("matches").select("kickoff").eq("tournament_id", id);
  const offDay = (matches ?? []).filter((match) => pragueIsoDay(match.kickoff) !== values.startsOn).length;
  if (offDay > 0) notes.push(plural(locale, offDay, m.matchesOffDay));

  refreshEverything();
  return ok([m.tournamentSaved, ...notes].join(" "));
}

export async function deleteTournamentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t, href } = formI18n(formData);
  const supabase = await adminClient(locale);
  const { error } = await supabase.from("tournaments").delete().eq("id", text(formData, "id"));
  if (error) return dbFailure(error, t);

  refreshEverything();
  redirect(href(`${PATHS.portal}/turnaje`));
}

/* -------------------------------------------------------------------------- */
/*  Zápasy                                                                    */
/* -------------------------------------------------------------------------- */

type MatchFormValues = Record<string, string>;

// Rozpis zápasu (fáze, čas, týmy, Clutch Time). Skóre a události se zapisují
// zvlášť v sekci Zapsat výsledky, aby se nemohly rozejít s góly.
function readMatch(formData: FormData): MatchFormValues {
  return {
    stage: text(formData, "stage"),
    kickoff: text(formData, "kickoff"),
    homeTeamId: text(formData, "homeTeamId"),
    awayTeamId: text(formData, "awayTeamId"),
    clutchMode: text(formData, "clutchMode"),
  };
}

/**
 * Zápas musí patřit k turnaji: výkop nejdřív v den turnaje (pražský čas) a oba
 * týmy se schválenou přihláškou — jinak by web ukázal špatný odpočet a místo
 * týmu „—“. Vrací chyby k polím formuláře.
 */
async function checkMatchFitsTournament(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  v: MatchFormValues,
  kickoff: string,
  locale: Locale,
  m: Dictionary["adminActions"]
): Promise<Record<string, string>> {
  const [tournament, entries] = await Promise.all([
    supabase.from("tournaments").select("starts_on").eq("id", tournamentId).maybeSingle(),
    supabase.from("tournament_entries").select("team_id").eq("tournament_id", tournamentId).eq("status", "approved"),
  ]);
  const errors: Record<string, string> = {};
  if (tournament.data && pragueIsoDay(kickoff) < tournament.data.starts_on) {
    errors.kickoff = fmt(m.kickoffBeforeTournament, { date: formatDate(tournament.data.starts_on, locale) });
  }
  if (entries.data) {
    const approved = new Set(entries.data.map((e) => e.team_id));
    if (!approved.has(v.homeTeamId)) errors.homeTeamId = m.teamNotApproved;
    if (!approved.has(v.awayTeamId)) errors.awayTeamId = m.teamNotApproved;
  }
  return errors;
}

function validateMatch(v: MatchFormValues, m: Dictionary["adminActions"]) {
  const errors: Record<string, string> = {};
  if (!v.stage) errors.stage = m.stageMissing;
  else if (v.stage.length > 40) errors.stage = m.max40;

  const kickoff = pragueLocalToIso(v.kickoff);
  if (!kickoff) errors.kickoff = m.kickoffMissing;
  if (!v.homeTeamId) errors.homeTeamId = m.homeMissing;
  if (!v.awayTeamId) errors.awayTeamId = m.awayMissing;
  if (v.homeTeamId && v.homeTeamId === v.awayTeamId) errors.awayTeamId = m.sameTeam;
  return { errors, kickoff };
}

export async function addMatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const supabase = await adminClient(locale);
  const tournamentId = text(formData, "tournamentId");
  const values = readMatch(formData);

  const { errors, kickoff } = validateMatch(values, t.adminActions);
  if (Object.keys(errors).length > 0 || !kickoff) return fail(t.actions.checkFields, errors, values);
  const fitErrors = await checkMatchFitsTournament(supabase, tournamentId, values, kickoff, locale, t.adminActions);
  if (Object.keys(fitErrors).length > 0) return fail(t.actions.checkFields, fitErrors, values);

  const { error } = await supabase.from("matches").insert({
    tournament_id: tournamentId,
    stage: values.stage,
    kickoff,
    home_team_id: values.homeTeamId,
    away_team_id: values.awayTeamId,
    clutch_mode: textOrNull(values.clutchMode),
  });
  if (error) return dbFailure(error, t, errors, values);

  refreshEverything();
  return ok(t.adminActions.matchAdded);
}

export async function updateMatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const supabase = await adminClient(locale);
  const values = readMatch(formData);

  const { errors, kickoff } = validateMatch(values, t.adminActions);
  if (Object.keys(errors).length > 0 || !kickoff) return fail(t.actions.checkFields, errors, values);
  const { data: current } = await supabase
    .from("matches")
    .select("tournament_id, home_team_id, away_team_id, events:match_events(id)")
    .eq("id", text(formData, "id"))
    .maybeSingle();
  if (!current) return fail(t.adminActions.matchMissing);
  const teamsChanged = current.home_team_id !== values.homeTeamId || current.away_team_id !== values.awayTeamId;
  if (teamsChanged && current.events.length > 0) {
    return fail(t.adminActions.matchHasEvents, {}, values);
  }
  const fitErrors = await checkMatchFitsTournament(supabase, current.tournament_id, values, kickoff, locale, t.adminActions);
  if (Object.keys(fitErrors).length > 0) return fail(t.actions.checkFields, fitErrors, values);

  const { data, error } = await supabase
    .from("matches")
    .update({
      stage: values.stage,
      kickoff,
      home_team_id: values.homeTeamId,
      away_team_id: values.awayTeamId,
      clutch_mode: textOrNull(values.clutchMode),
    })
    .eq("id", text(formData, "id"))
    .select("id");
  if (error) return dbFailure(error, t, errors, values);
  if (data.length === 0) return fail(t.adminActions.matchMissing);

  refreshEverything();
  return ok(t.adminActions.matchSaved);
}

export async function deleteMatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const supabase = await adminClient(locale);
  const { error } = await supabase.from("matches").delete().eq("id", text(formData, "id"));
  if (error) return dbFailure(error, t);

  refreshEverything();
  return ok(t.adminActions.matchDeleted);
}

/* -------------------------------------------------------------------------- */
/*  Skupiny, pořadí, střelci, ocenění                                         */
/* -------------------------------------------------------------------------- */

export async function saveEntryRankingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const m = t.adminActions;
  const supabase = await adminClient(locale);
  const groupLabel = text(formData, "groupLabel");
  const rankRaw = text(formData, "finalRank");
  const finalRank = intOrNull(rankRaw);
  const advanced = checkbox(formData, "advanced");
  const values = { groupLabel, finalRank: rankRaw, advanced: advanced ? "on" : "" };

  const errors: Record<string, string> = {};
  if (groupLabel.length > 10) errors.groupLabel = m.max10;
  if (finalRank !== null && (Number.isNaN(finalRank) || finalRank < 1 || finalRank > 99)) {
    errors.finalRank = m.rankRange;
  }
  if (Object.keys(errors).length > 0) {
    return fail(t.actions.checkFields, errors, values);
  }

  const { data, error } = await supabase
    .from("tournament_entries")
    .update({ group_label: textOrNull(groupLabel), final_rank: finalRank, advanced })
    .eq("tournament_id", text(formData, "tournamentId"))
    .eq("team_id", text(formData, "teamId"))
    .select("team_id");
  if (error) return dbFailure(error, t, {}, values);
  if (data.length === 0) return fail(m.entryMissing);

  refreshEverything();
  return ok(m.saved);
}

export async function addScorerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const m = t.adminActions;
  const supabase = await adminClient(locale);
  const values = {
    player: text(formData, "player"),
    teamId: text(formData, "teamId"),
    goals: text(formData, "goals"),
  };

  const errors: Record<string, string> = {};
  if (!values.player) errors.player = m.playerMissing;
  else if (values.player.length > 120) errors.player = m.max120;
  if (!values.teamId) errors.teamId = m.teamMissing;
  const goals = intOrNull(values.goals);
  if (goals === null || Number.isNaN(goals) || goals < 0 || goals > 99) errors.goals = m.goalsMissing;
  if (Object.keys(errors).length > 0 || goals === null) {
    return fail(t.actions.checkFields, errors, values);
  }

  const { error } = await supabase.from("scorers").insert({
    tournament_id: text(formData, "tournamentId"),
    team_id: values.teamId,
    player_name: values.player,
    goals,
  });
  if (error) return dbFailure(error, t, {}, values);

  refreshEverything();
  return ok(m.scorerAdded);
}

export async function deleteScorerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const supabase = await adminClient(locale);
  const { error } = await supabase.from("scorers").delete().eq("id", text(formData, "id"));
  if (error) return dbFailure(error, t);

  refreshEverything();
  return ok(t.adminActions.scorerDeleted);
}

export async function saveAwardsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const m = t.adminActions;
  const supabase = await adminClient(locale);
  const values = {
    mvpPlayer: text(formData, "mvpPlayer"),
    mvpTeamId: text(formData, "mvpTeamId"),
    keeperPlayer: text(formData, "keeperPlayer"),
    keeperTeamId: text(formData, "keeperTeamId"),
  };

  // Ocenění je dvojice hráč + tým — jedno bez druhého by veřejný web nezobrazil.
  const errors: Record<string, string> = {};
  if (values.mvpPlayer && !values.mvpTeamId) errors.mvpTeamId = m.mvpTeamMissing;
  if (!values.mvpPlayer && values.mvpTeamId) errors.mvpPlayer = m.mvpPlayerMissing;
  if (values.keeperPlayer && !values.keeperTeamId) errors.keeperTeamId = m.keeperTeamMissing;
  if (!values.keeperPlayer && values.keeperTeamId) errors.keeperPlayer = m.keeperPlayerMissing;
  if (Object.keys(errors).length > 0) return fail(t.actions.checkFields, errors, values);

  const { data, error } = await supabase
    .from("tournaments")
    .update({
      mvp_player: textOrNull(values.mvpPlayer),
      mvp_team_id: textOrNull(values.mvpTeamId),
      best_keeper_player: textOrNull(values.keeperPlayer),
      best_keeper_team_id: textOrNull(values.keeperTeamId),
    })
    .eq("id", text(formData, "tournamentId"))
    .select("id");
  if (error) return dbFailure(error, t, {}, values);
  if (data.length === 0) return fail(m.tournamentMissing);

  refreshEverything();
  return ok(m.awardsSaved);
}
