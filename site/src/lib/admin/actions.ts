"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PATHS } from "@/lib/portal/paths";
import { requireRole } from "@/lib/portal/session";
import { fail, ok, checkbox, text, type FormState } from "@/lib/portal/validation";
import type { TournamentStatus, TournamentWrite } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { intOrNull, pragueLocalToIso, slugify, textOrNull } from "./helpers";

// Zápisy organizátora. Každá akce nejdřív ověří roli admin, ale skutečnou
// ochranu drží databáze (RLS) — kdyby se kontrola někdy obešla, zápis stejně
// neprojde nikomu jiného než adminovi.

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Změna se projeví na veřejném webu, v přihlášce týmu i v portálu. */
function refreshEverything() {
  revalidatePath("/");
  revalidatePath("/turnaje");
  revalidatePath("/turnaje/[slug]", "page");
  revalidatePath(PATHS.teamRegistration);
  revalidatePath(PATHS.portal, "layout");
}

async function adminClient() {
  await requireRole("admin");
  return createClient();
}

function dbFailure(error: PostgrestError, errors: Record<string, string> = {}, values?: Record<string, string>) {
  const constraint = error.message.match(/constraint "([^"]+)"/)?.[1];

  if (error.code === "23505" && constraint === "tournaments_slug_key") {
    return fail("Zkontroluj zvýrazněná pole.", { ...errors, slug: "Tahle adresa už patří jinému turnaji." }, values);
  }
  if (error.code === "23505" && constraint === "tournaments_single_open_registration") {
    return fail("Přihlášky smí být otevřené jen na jeden turnaj najednou.", errors, values);
  }
  if (error.code === "23514" && constraint === "tournaments_check") {
    return fail("Odehraný turnaj nemůže mít otevřené přihlášky.", errors, values);
  }
  if (error.code === "23503") {
    return fail("Tohle jde smazat až po odstranění navázaných dat (např. zápasů).", errors, values);
  }
  if (error.code === "42501") return fail("Na tohle nemáš oprávnění.", errors, values);

  console.error("[admin]", error.code, error.message);
  return fail("Uložení se nepovedlo. Zkus to prosím znovu.", errors, values);
}

/* -------------------------------------------------------------------------- */
/*  Přihlášky týmů                                                            */
/* -------------------------------------------------------------------------- */

export async function setEntryStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const status = text(formData, "status");
  if (status !== "approved" && status !== "pending") return fail("Neplatný stav přihlášky.");

  const { data, error } = await supabase
    .from("tournament_entries")
    .update({ status })
    .eq("tournament_id", text(formData, "tournamentId"))
    .eq("team_id", text(formData, "teamId"))
    .select("team_id");
  if (error) return dbFailure(error);
  if (data.length === 0) return fail("Přihláška už neexistuje.");

  refreshEverything();
  return ok(status === "approved" ? "Přihláška je schválená." : "Přihláška je vrácená ke schválení.");
}

export async function removeEntryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const { error } = await supabase
    .from("tournament_entries")
    .delete()
    .eq("tournament_id", text(formData, "tournamentId"))
    .eq("team_id", text(formData, "teamId"));
  if (error) return dbFailure(error);

  refreshEverything();
  return ok("Přihláška je odmítnutá.");
}

/* -------------------------------------------------------------------------- */
/*  Turnaje                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveTournamentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();

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
    minRoster: text(formData, "minRoster") || "3",
    status: text(formData, "status") || "upcoming",
    registrationOpen: checkbox(formData, "registrationOpen") ? "on" : "",
  };

  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "Chybí název turnaje.";
  else if (values.name.length > 80) errors.name = "Název může mít nejvýš 80 znaků.";

  const slug = values.slug || slugify(values.name);
  if (!slug || !SLUG_RE.test(slug)) errors.slug = "Použij jen malá písmena bez diakritiky, čísla a pomlčky.";

  if (!DATE_RE.test(values.startsOn) || Number.isNaN(Date.parse(values.startsOn))) {
    errors.startsOn = "Zadej datum turnaje.";
  }

  const minRoster = Number(values.minRoster);
  if (!Number.isInteger(minRoster) || minRoster < 1 || minRoster > 30) {
    errors.minRoster = "Zadej číslo od 1 do 30.";
  }
  const status: TournamentStatus | null =
    values.status === "completed" || values.status === "upcoming" ? values.status : null;
  if (!status) errors.status = "Vyber stav.";
  if (values.summary.length > 600) errors.summary = "Popis může mít nejvýš 600 znaků.";

  if (Object.keys(errors).length > 0 || !status) return fail("Zkontroluj zvýrazněná pole.", errors, values);

  // Odehraný turnaj nemůže přijímat přihlášky.
  const registrationOpen = values.registrationOpen === "on" && status === "upcoming";

  // Přihlášky smí být otevřené jen na jeden turnaj — ostatní nejdřív zavřeme.
  if (registrationOpen) {
    let close = supabase.from("tournaments").update({ registration_open: false }).eq("registration_open", true);
    if (id) close = close.neq("id", id);
    const { error } = await close;
    if (error) return dbFailure(error, {}, values);
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
    status,
    registration_open: registrationOpen,
  };

  if (!id) {
    const { data, error } = await supabase.from("tournaments").insert(row).select("id").single();
    if (error) return dbFailure(error, {}, values);
    refreshEverything();
    redirect(`${PATHS.portal}/turnaje/${data.id}`);
  }

  const { data, error } = await supabase.from("tournaments").update(row).eq("id", id).select("id");
  if (error) return dbFailure(error, {}, values);
  if (data.length === 0) return fail("Turnaj už neexistuje.");

  refreshEverything();
  const note =
    values.registrationOpen === "on" && !registrationOpen
      ? " Přihlášky zůstaly zavřené, protože turnaj je odehraný."
      : "";
  return ok(`Turnaj je uložený.${note}`);
}

export async function deleteTournamentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const { error } = await supabase.from("tournaments").delete().eq("id", text(formData, "id"));
  if (error) return dbFailure(error);

  refreshEverything();
  redirect(`${PATHS.portal}/turnaje`);
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

function validateMatch(v: MatchFormValues) {
  const errors: Record<string, string> = {};
  if (!v.stage) errors.stage = "Chybí fáze, třeba Skupina A nebo Finále.";
  else if (v.stage.length > 40) errors.stage = "Nejvýš 40 znaků.";

  const kickoff = pragueLocalToIso(v.kickoff);
  if (!kickoff) errors.kickoff = "Zadej datum a čas výkopu.";
  if (!v.homeTeamId) errors.homeTeamId = "Vyber domácí tým.";
  if (!v.awayTeamId) errors.awayTeamId = "Vyber hostující tým.";
  if (v.homeTeamId && v.homeTeamId === v.awayTeamId) errors.awayTeamId = "Tým nemůže hrát sám proti sobě.";
  return { errors, kickoff };
}

export async function addMatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const tournamentId = text(formData, "tournamentId");
  const values = readMatch(formData);

  const { errors, kickoff } = validateMatch(values);
  if (Object.keys(errors).length > 0 || !kickoff) return fail("Zkontroluj zvýrazněná pole.", errors, values);

  const { error } = await supabase.from("matches").insert({
    tournament_id: tournamentId,
    stage: values.stage,
    kickoff,
    home_team_id: values.homeTeamId,
    away_team_id: values.awayTeamId,
    clutch_mode: textOrNull(values.clutchMode),
  });
  if (error) return dbFailure(error, errors, values);

  refreshEverything();
  return ok("Zápas je přidaný.");
}

export async function updateMatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const values = readMatch(formData);

  const { errors, kickoff } = validateMatch(values);
  if (Object.keys(errors).length > 0 || !kickoff) return fail("Zkontroluj zvýrazněná pole.", errors, values);

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
  if (error) return dbFailure(error, errors, values);
  if (data.length === 0) return fail("Zápas už neexistuje.");

  refreshEverything();
  return ok("Zápas je uložený.");
}

export async function deleteMatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const { error } = await supabase.from("matches").delete().eq("id", text(formData, "id"));
  if (error) return dbFailure(error);

  refreshEverything();
  return ok("Zápas je smazaný.");
}

/* -------------------------------------------------------------------------- */
/*  Skupiny, pořadí, střelci, ocenění                                         */
/* -------------------------------------------------------------------------- */

export async function saveEntryRankingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const groupLabel = text(formData, "groupLabel");
  const rankRaw = text(formData, "finalRank");
  const finalRank = intOrNull(rankRaw);
  const advanced = checkbox(formData, "advanced");
  const values = { groupLabel, finalRank: rankRaw, advanced: advanced ? "on" : "" };

  const errors: Record<string, string> = {};
  if (groupLabel.length > 10) errors.groupLabel = "Nejvýš 10 znaků.";
  if (finalRank !== null && (Number.isNaN(finalRank) || finalRank < 1 || finalRank > 99)) {
    errors.finalRank = "1 až 99.";
  }
  if (Object.keys(errors).length > 0) {
    return fail("Zkontroluj zvýrazněná pole.", errors, values);
  }

  const { data, error } = await supabase
    .from("tournament_entries")
    .update({ group_label: textOrNull(groupLabel), final_rank: finalRank, advanced })
    .eq("tournament_id", text(formData, "tournamentId"))
    .eq("team_id", text(formData, "teamId"))
    .select("team_id");
  if (error) return dbFailure(error, {}, values);
  if (data.length === 0) return fail("Přihláška už neexistuje.");

  refreshEverything();
  return ok("Uloženo.");
}

export async function addScorerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const values = {
    player: text(formData, "player"),
    teamId: text(formData, "teamId"),
    goals: text(formData, "goals"),
  };

  const errors: Record<string, string> = {};
  if (!values.player) errors.player = "Chybí jméno hráče.";
  else if (values.player.length > 120) errors.player = "Nejvýš 120 znaků.";
  if (!values.teamId) errors.teamId = "Vyber tým.";
  const goals = intOrNull(values.goals);
  if (goals === null || Number.isNaN(goals) || goals < 0 || goals > 99) errors.goals = "Zadej počet gólů.";
  if (Object.keys(errors).length > 0 || goals === null) {
    return fail("Zkontroluj zvýrazněná pole.", errors, values);
  }

  const { error } = await supabase.from("scorers").insert({
    tournament_id: text(formData, "tournamentId"),
    team_id: values.teamId,
    player_name: values.player,
    goals,
  });
  if (error) return dbFailure(error, {}, values);

  refreshEverything();
  return ok("Střelec je přidaný.");
}

export async function deleteScorerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const { error } = await supabase.from("scorers").delete().eq("id", text(formData, "id"));
  if (error) return dbFailure(error);

  refreshEverything();
  return ok("Střelec je smazaný.");
}

export async function saveAwardsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const values = {
    mvpPlayer: text(formData, "mvpPlayer"),
    mvpTeamId: text(formData, "mvpTeamId"),
    keeperPlayer: text(formData, "keeperPlayer"),
    keeperTeamId: text(formData, "keeperTeamId"),
  };

  // Ocenění je dvojice hráč + tým — jedno bez druhého by veřejný web nezobrazil.
  const errors: Record<string, string> = {};
  if (values.mvpPlayer && !values.mvpTeamId) errors.mvpTeamId = "Vyber tým hráče.";
  if (!values.mvpPlayer && values.mvpTeamId) errors.mvpPlayer = "Doplň jméno hráče.";
  if (values.keeperPlayer && !values.keeperTeamId) errors.keeperTeamId = "Vyber tým brankáře.";
  if (!values.keeperPlayer && values.keeperTeamId) errors.keeperPlayer = "Doplň jméno brankáře.";
  if (Object.keys(errors).length > 0) return fail("Zkontroluj zvýrazněná pole.", errors, values);

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
  if (error) return dbFailure(error, {}, values);
  if (data.length === 0) return fail("Turnaj už neexistuje.");

  refreshEverything();
  return ok("Ocenění je uložené.");
}
