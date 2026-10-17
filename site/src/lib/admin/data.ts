import { pragueIsoDay } from "@/lib/format";
import type {
  Database,
  EntryConfirmation,
  EntryStatus,
  MatchEventKind,
  PlayerPosition,
  TournamentStatus,
  UserRole,
} from "@/lib/supabase/database.types";
import { missingTable } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import {
  compareTournaments,
  isPublished,
  startTimeOf,
  tournamentPhase,
  type TournamentPhase,
} from "@/lib/tournamentModel";

// Čtení dat pro administraci. Dotazy jdou za přihlášeného admina, takže vidí
// všechno díky politikám „Admin čte …“ v databázi. Kdyby je zavolal někdo
// jiný, RLS mu vrátí prázdný výsledek — kontrola role v UI je jen pohodlí.

type TournamentRow = Database["public"]["Tables"]["tournaments"]["Row"];

/* -------------------------------------------------------------------------- */
/*  Turnaje v sekcích portálu                                                 */
/* -------------------------------------------------------------------------- */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Id z adresy (/portal/…/[turnaj]) — cokoli jiného než UUID databáze odmítne chybou. */
export const isUuid = (id: string) => UUID.test(id);

/**
 * Turnaj, jak ho potřebuje administrace — společný základ pro Rozpis turnajů
 * i výběr turnaje v ostatních sekcích (karty v Přehledu, Přihláškách,
 * Zapsat výsledky).
 */
export type AdminTournamentInfo = {
  id: string;
  slug: string;
  name: string;
  startsOn: string;
  /** Čas začátku "HH:MM" (pražský čas), null = nezadaný. */
  startTime: string | null;
  venue: string;
  format: string;
  status: TournamentStatus;
  /** Stav pro organizátora: připravuje se / otevřené přihlášky / probíhá / odehráno. */
  phase: TournamentPhase;
  registrationOpen: boolean;
  /** Zobrazený na webu (úvodní stránka, archiv). */
  published: boolean;
  minRoster: number;
  maxRoster: number;
  /** Startovné v Kč za tým (0 = bez startovného). */
  entryFee: number;
};

function toTournamentInfo(t: TournamentRow): AdminTournamentInfo {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    startsOn: t.starts_on,
    startTime: startTimeOf(t),
    venue: t.venue,
    format: t.format,
    status: t.status,
    phase: tournamentPhase(t.status, t.registration_open),
    registrationOpen: t.registration_open,
    published: isPublished(t),
    minRoster: t.min_roster,
    // Před migrací č. 7 sloupec chybí — stejný výchozí limit jako v databázi.
    maxRoster: t.max_roster ?? 10,
    // Před migrací č. 11 sloupec chybí — bez startovného.
    entryFee: t.entry_fee ?? 0,
  };
}

/**
 * Turnaje, které ještě nejsou odehrané: nejdřív ten s otevřenými přihláškami,
 * pak probíhající a nadcházející podle data. První z nich je „hlavní turnaj“ —
 * na něj se dívá seznam uživatelů.
 */
export async function listUpcomingTournaments(): Promise<AdminTournamentInfo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    // "*": funguje i bez sloupců z novějších migrací.
    .select("*")
    .neq("status", "completed");
  if (error) throw error;
  return data
    .map(toTournamentInfo)
    .sort((a, b) => Number(b.registrationOpen) - Number(a.registrationOpen) || compareTournaments(a, b));
}

/** Karta turnaje v sekcích portálu (Přehled, Přihlášky, Rozpis turnajů, Zapsat výsledky). */
export type TournamentSummary = AdminTournamentInfo & {
  /** Přihlášky podle stavu. */
  counts: Record<EntryStatus, number>;
  matches: number;
  /** Zápasy se zapsaným výsledkem. */
  played: number;
};

/**
 * Všechny turnaje pro karty v sekcích portálu (compareTournaments: probíhající
 * a nadcházející nahoře od nejbližšího, odehrané pod nimi od nejnovějšího).
 * Každá tabulka se čte jednou; počty přihlášek a zápasů se sečtou tady.
 */
export async function listTournamentSummaries(): Promise<TournamentSummary[]> {
  const supabase = await createClient();
  const [tournaments, entries, matches] = await Promise.all([
    // "*": funguje i bez sloupců z novějších migrací.
    supabase.from("tournaments").select("*"),
    supabase.from("tournament_entries").select("tournament_id, status"),
    supabase.from("matches").select("tournament_id, home_goals"),
  ]);
  if (tournaments.error) throw tournaments.error;
  if (entries.error) throw entries.error;
  if (matches.error) throw matches.error;

  return tournaments.data
    .map((t) => {
      const counts: Record<EntryStatus, number> = { pending: 0, approved: 0, rejected: 0 };
      for (const e of entries.data) if (e.tournament_id === t.id) counts[e.status]++;
      const own = matches.data.filter((m) => m.tournament_id === t.id);
      return {
        ...toTournamentInfo(t),
        counts,
        matches: own.length,
        played: own.filter((m) => m.home_goals !== null).length,
      };
    })
    .sort(compareTournaments);
}

/* -------------------------------------------------------------------------- */
/*  Přihlášky týmů                                                            */
/* -------------------------------------------------------------------------- */

export type RosterPlayer = {
  name: string;
  number: number | null;
  position: PlayerPosition;
  birthYear: number | null;
  captain: boolean;
};

export type AdminEntry = {
  tournamentId: string;
  teamId: string;
  teamName: string;
  city: string;
  colors: string;
  code: string;
  note: string;
  status: EntryStatus;
  /** Důvod zamítnutí (migrace č. 8). */
  statusNote: string;
  /** Kdy organizátor naposledy změnil stav (migrace č. 8). */
  statusChangedAt: string | null;
  createdAt: string;
  players: RosterPlayer[];
  /** Zápasy týmu v rozpisu turnaje — při vyřazení týmu by se musely smazat. */
  matches: number;
  /** Z toho zápasy se zapsaným výsledkem — kvůli nim tým vyřadit nejde. */
  playedMatches: number;
  captain: { name: string; email: string; phone: string } | null;
  /** Co kapitán při odeslání potvrdil (migrace č. 11); prázdné u starších přihlášek. */
  confirmations: EntryConfirmation[];
  /** Kdy přihlášku s potvrzeními odeslal; null = přihláška z doby před potvrzováním. */
  confirmedAt: string | null;
  /** Startovné, které kapitán při odeslání viděl. */
  confirmedFee: number | null;
  /** Startovné přijato — kdy a kým (organizátor); null = nezaplaceno. */
  paid: { at: string; by: string | null } | null;
};

export type AdminEntryGroup = {
  tournament: AdminTournamentInfo;
  counts: Record<EntryStatus, number>;
  entries: AdminEntry[];
};

const STATUS_ORDER: Record<EntryStatus, number> = { pending: 0, approved: 1, rejected: 2 };

/**
 * Přihlášky na jeden turnaj (null = turnaj neexistuje). Čekající nahoře
 * (nejstarší první — kdo dřív přišel), pak schválené podle názvu,
 * zamítnuté nakonec.
 */
export async function getEntryGroup(tournamentId: string): Promise<AdminEntryGroup | null> {
  if (!isUuid(tournamentId)) return null;
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("tournaments").select("*").eq("id", tournamentId).maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const tournament = toTournamentInfo(row);

  const [entries, matches] = await Promise.all([
    supabase
      .from("tournament_entries")
      .select(
        "*, team:teams(name, city, colors, code, note, owner_id, players(first_name, last_name, shirt_number, position, birth_year, is_captain))"
      )
      .eq("tournament_id", tournamentId),
    supabase.from("matches").select("home_team_id, away_team_id, home_goals").eq("tournament_id", tournamentId),
  ]);
  if (entries.error) throw entries.error;
  if (matches.error) throw matches.error;

  // Kapitáni týmů a organizátoři, kteří označili platbu — jedním dotazem.
  const ownerIds = [
    ...new Set(
      entries.data.flatMap((e) => [...(e.team?.owner_id ? [e.team.owner_id] : []), ...(e.paid_by ? [e.paid_by] : [])])
    ),
  ];
  const { data: owners, error: ownersError } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", ownerIds)
    : { data: [], error: null };
  if (ownersError) throw ownersError;
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  const rows: AdminEntry[] = entries.data.flatMap((e) => {
    if (!e.team) return [];
    const owner = e.team.owner_id ? ownerById.get(e.team.owner_id) : undefined;
    const own = matches.data.filter((m) => m.home_team_id === e.team_id || m.away_team_id === e.team_id);
    return [
      {
        tournamentId: e.tournament_id,
        teamId: e.team_id,
        teamName: e.team.name,
        city: e.team.city,
        colors: e.team.colors,
        code: e.team.code,
        note: e.team.note,
        status: e.status,
        statusNote: e.status_note ?? "",
        statusChangedAt: e.status_changed_at ?? null,
        createdAt: e.created_at,
        players: e.team.players
          .map((p) => ({
            name: `${p.first_name} ${p.last_name}`,
            number: p.shirt_number,
            position: p.position,
            birthYear: p.birth_year,
            captain: p.is_captain,
          }))
          .sort((a, b) => (a.number ?? 999) - (b.number ?? 999) || a.name.localeCompare(b.name, "cs")),
        matches: own.length,
        playedMatches: own.filter((m) => m.home_goals !== null).length,
        captain: owner ? { name: owner.full_name, email: owner.email, phone: owner.phone } : null,
        // Před migrací č. 11 sloupce chybí.
        confirmations: e.confirmations ?? [],
        confirmedAt: e.confirmed_at ?? null,
        confirmedFee: e.confirmed_fee ?? null,
        paid: e.paid_at
          ? { at: e.paid_at, by: e.paid_by ? (ownerById.get(e.paid_by)?.full_name ?? null) : null }
          : null,
      },
    ];
  });

  rows.sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (a.status === "pending"
        ? a.createdAt.localeCompare(b.createdAt)
        : a.status === "rejected"
          ? (b.statusChangedAt ?? "").localeCompare(a.statusChangedAt ?? "")
          : a.teamName.localeCompare(b.teamName, "cs"))
  );
  const counts: Record<EntryStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of rows) counts[r.status]++;
  return { tournament, counts, entries: rows };
}

/**
 * Turnaj, na který se právě přihlašuje (otevřený smí být jen jeden), nebo null.
 * Přepínač přihlášek v přehledu turnaje podle něj řekne, co se zavře.
 */
export async function getRegistrationOpenTournament(): Promise<{ id: string; name: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("registration_open", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Čekající přihlášky na turnaje, které ještě nejsou odehrané (odznak v liště). */
export async function countPendingEntries(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("tournament_entries")
    .select("team_id, tournament:tournaments!inner(status)", { count: "exact", head: true })
    .eq("status", "pending")
    .neq("tournament.status", "completed");
  if (error) {
    console.error("[admin] počet čekajících přihlášek", error.code, error.message);
    return 0;
  }
  return count ?? 0;
}

/* -------------------------------------------------------------------------- */
/*  Přehled                                                                   */
/* -------------------------------------------------------------------------- */

/** Přehled jednoho turnaje: přihlášky a co je potřeba udělat. */
export type TournamentOverview = {
  group: AdminEntryGroup;
  /** Schválené a čekající týmy, jejichž soupiska nesplňuje limity turnaje. */
  rosterIssues: { teamId: string; teamName: string; players: number }[];
  matches: number;
  played: number;
  /** Zápasy, které k turnaji nesedí (jiný den, tým bez schválené přihlášky). */
  matchIssues: number;
  /** Zápasy po výkopu bez zapsaného výsledku. */
  resultsMissing: number;
};

export async function getTournamentOverview(tournamentId: string): Promise<TournamentOverview | null> {
  const group = await getEntryGroup(tournamentId);
  if (!group) return null;
  const { tournament } = group;

  const supabase = await createClient();
  const { data: matches, error } = await supabase
    .from("matches")
    .select("kickoff, home_team_id, away_team_id, home_goals")
    .eq("tournament_id", tournamentId);
  if (error) throw error;

  const approved = new Set(group.entries.filter((e) => e.status === "approved").map((e) => e.teamId));
  const now = Date.now();
  return {
    group,
    rosterIssues: group.entries
      .filter(
        (e) =>
          e.status !== "rejected" &&
          (e.players.length < tournament.minRoster || e.players.length > tournament.maxRoster)
      )
      .map((e) => ({ teamId: e.teamId, teamName: e.teamName, players: e.players.length })),
    matches: matches.length,
    played: matches.filter((m) => m.home_goals !== null).length,
    matchIssues: matches.filter(
      (m) =>
        pragueIsoDay(m.kickoff) !== tournament.startsOn ||
        !approved.has(m.home_team_id) ||
        !approved.has(m.away_team_id)
    ).length,
    resultsMissing: matches.filter((m) => m.home_goals === null && Date.parse(m.kickoff) < now).length,
  };
}

/** Kapitáni s účtem, ale bez týmu — nedokončili přihlášku (úkol na hlavním přehledu). */
export async function countCaptainsWithoutTeam(): Promise<number> {
  const supabase = await createClient();
  const [profiles, teams] = await Promise.all([
    supabase.from("profiles").select("id").eq("role", "captain"),
    supabase.from("teams").select("owner_id"),
  ]);
  if (profiles.error) throw profiles.error;
  if (teams.error) throw teams.error;
  const owners = new Set(teams.data.flatMap((t) => (t.owner_id ? [t.owner_id] : [])));
  return profiles.data.filter((p) => !owners.has(p.id)).length;
}

/* -------------------------------------------------------------------------- */
/*  Turnaje                                                                   */
/* -------------------------------------------------------------------------- */

export type AdminEntryRow = {
  teamId: string;
  teamName: string;
  city: string;
  status: EntryStatus;
  groupLabel: string | null;
  finalRank: number | null;
  /** Tým postoupil dál (zvýrazní se v tabulce skupiny). */
  advanced: boolean;
};

export type AdminMatch = {
  id: string;
  stage: string;
  kickoff: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  clutchMode: string | null;
};

export type AdminScorer = { id: string; teamId: string; player: string; goals: number };

export type AdminTournament = {
  /** Řádek z databáze (formulář turnaje, ocenění). */
  tournament: TournamentRow;
  /** Tentýž turnaj ve společném tvaru (stav, čas, zobrazení na webu). */
  info: AdminTournamentInfo;
  entries: AdminEntryRow[];
  matches: AdminMatch[];
  scorers: AdminScorer[];
};

function toEntryRows(
  rows: {
    team_id: string;
    status: EntryStatus;
    group_label: string | null;
    final_rank: number | null;
    advanced: boolean;
    team: { name: string; city: string } | null;
  }[]
): AdminEntryRow[] {
  return rows
    .flatMap((e) =>
      e.team
        ? [
            {
              teamId: e.team_id,
              teamName: e.team.name,
              city: e.team.city,
              status: e.status,
              groupLabel: e.group_label,
              finalRank: e.final_rank,
              advanced: e.advanced,
            } satisfies AdminEntryRow,
          ]
        : []
    )
    .sort(
      (a, b) =>
        (a.finalRank ?? 999) - (b.finalRank ?? 999) || a.teamName.localeCompare(b.teamName, "cs")
    );
}

export async function getAdminTournament(id: string): Promise<AdminTournament | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!tournament) return null;

  const [entries, matches, scorers] = await Promise.all([
    supabase
      .from("tournament_entries")
      .select("team_id, status, group_label, final_rank, advanced, team:teams(name, city)")
      .eq("tournament_id", id),
    supabase
      .from("matches")
      .select("id, stage, kickoff, home_team_id, away_team_id, home_goals, away_goals, clutch_mode")
      .eq("tournament_id", id)
      .order("kickoff"),
    supabase
      .from("scorers")
      .select("id, team_id, player_name, goals")
      .eq("tournament_id", id)
      .order("goals", { ascending: false }),
  ]);
  if (entries.error) throw entries.error;
  if (matches.error) throw matches.error;
  if (scorers.error) throw scorers.error;

  return {
    tournament,
    info: toTournamentInfo(tournament),
    entries: toEntryRows(entries.data),
    matches: matches.data.map((m) => ({
      id: m.id,
      stage: m.stage,
      kickoff: m.kickoff,
      homeTeamId: m.home_team_id,
      awayTeamId: m.away_team_id,
      homeGoals: m.home_goals,
      awayGoals: m.away_goals,
      clutchMode: m.clutch_mode,
    })),
    scorers: scorers.data.map((s) => ({
      id: s.id,
      teamId: s.team_id,
      player: s.player_name,
      goals: s.goals,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Zápis výsledků                                                            */
/* -------------------------------------------------------------------------- */

export type ResultMatchRow = AdminMatch & {
  homeTeam: string;
  awayTeam: string;
  goals: number;
  cards: number;
};

/** Hráč v kartě týmu: statistiky za celý turnaj. */
export type ResultPlayer = {
  /** Hráč ze soupisky; null = statistika zůstala uložená, ale kapitán hráče smazal. */
  playerId: string | null;
  /** Uložená statistika (řádek player_stats); null = zatím nezapsaná. */
  statId: string | null;
  firstName: string;
  lastName: string;
  number: number | null;
  minutes: number;
  goals: number;
  yellow: number;
  red: number;
};

/** Schválený tým v Zapsat výsledky: umístění, postup a hráči se statistikami. */
export type ResultTeam = AdminEntryRow & {
  players: ResultPlayer[];
  /** Statistiky týmu už organizátor uložil (jinak jsou góly a karty spočítané ze zápasů). */
  statsSaved: boolean;
};

export type ResultsOverview = {
  tournament: TournamentRow;
  teams: ResultTeam[];
  matches: ResultMatchRow[];
  /** False = v databázi chybí tabulka statistik hráčů (migrace č. 9). */
  statsReady: boolean;
};

const nameKey = (teamId: string, first: string, last: string) =>
  `${teamId}|${first} ${last}`.toLocaleLowerCase("cs");

/**
 * Zápasy turnaje pro výběr k zápisu výsledku + schválené týmy pro umístění,
 * postup a statistiky hráčů. Dokud tým nemá statistiky uložené, jsou góly
 * a karty předvyplněné z událostí zapsaných u zápasů.
 */
export async function getResultsOverview(tournamentId: string): Promise<ResultsOverview | null> {
  const data = await getAdminTournament(tournamentId);
  if (!data) return null;

  const supabase = await createClient();
  const matchIds = data.matches.map((m) => m.id);
  const approved = data.entries.filter((e) => e.status === "approved");
  const approvedIds = approved.map((e) => e.teamId);
  const [eventsRes, playersRes, statsRes] = await Promise.all([
    matchIds.length
      ? supabase.from("match_events").select("match_id, kind, team_id, first_name, last_name").in("match_id", matchIds)
      : Promise.resolve({ data: [], error: null }),
    approvedIds.length
      ? supabase.from("players").select("id, team_id, first_name, last_name, shirt_number").in("team_id", approvedIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("player_stats")
      .select("id, team_id, player_id, first_name, last_name, shirt_number, minutes, goals, yellow_cards, red_cards")
      .eq("tournament_id", tournamentId),
  ]);
  const { data: events, error } = eventsRes;
  if (error) throw error;
  if (playersRes.error) throw playersRes.error;
  if (statsRes.error && !missingTable(statsRes.error)) throw statsRes.error;
  const stats = statsRes.data ?? [];

  // Góly a karty ze zápasů po hráčích — předvyplnění, dokud tým nemá uložené statistiky.
  const fromEvents = new Map<string, { goals: number; yellow: number; red: number }>();
  for (const e of events) {
    const key = nameKey(e.team_id, e.first_name, e.last_name);
    const row = fromEvents.get(key) ?? { goals: 0, yellow: 0, red: 0 };
    if (e.kind === "goal") row.goals++;
    else if (e.kind === "yellow_card") row.yellow++;
    else row.red++;
    fromEvents.set(key, row);
  }

  const teams: ResultTeam[] = approved.map((entry) => {
    const saved = stats.filter((s) => s.team_id === entry.teamId);
    const roster = playersRes.data.filter((p) => p.team_id === entry.teamId);
    const rosterIds = new Set(roster.map((p) => p.id));
    const statsSaved = saved.length > 0;

    const players: ResultPlayer[] = [
      ...roster.map((p) => {
        const s = saved.find((row) => row.player_id === p.id);
        const e = statsSaved ? undefined : fromEvents.get(nameKey(p.team_id, p.first_name, p.last_name));
        return {
          playerId: p.id,
          statId: s?.id ?? null,
          firstName: p.first_name,
          lastName: p.last_name,
          number: p.shirt_number,
          minutes: s?.minutes ?? 0,
          goals: s?.goals ?? e?.goals ?? 0,
          yellow: s?.yellow_cards ?? e?.yellow ?? 0,
          red: s?.red_cards ?? e?.red ?? 0,
        };
      }),
      // Statistiky hráčů, kteří už na soupisce nejsou.
      ...saved
        .filter((s) => !s.player_id || !rosterIds.has(s.player_id))
        .map((s) => ({
          playerId: null,
          statId: s.id,
          firstName: s.first_name,
          lastName: s.last_name,
          number: s.shirt_number,
          minutes: s.minutes,
          goals: s.goals,
          yellow: s.yellow_cards,
          red: s.red_cards,
        })),
    ].sort(
      (a, b) =>
        Number(b.playerId !== null) - Number(a.playerId !== null) ||
        (a.number ?? 100) - (b.number ?? 100) ||
        a.lastName.localeCompare(b.lastName, "cs")
    );

    return { ...entry, players, statsSaved };
  });

  const teamName = new Map(data.entries.map((e) => [e.teamId, e.teamName]));
  // Zápas může hrát i tým, který už na turnaji není (odmítnutá přihláška).
  const missing = [
    ...new Set(data.matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]).filter((id) => !teamName.has(id))),
  ];
  if (missing.length) {
    const { data: teams } = await supabase.from("teams").select("id, name").in("id", missing);
    for (const t of teams ?? []) teamName.set(t.id, t.name);
  }

  return {
    tournament: data.tournament,
    teams,
    statsReady: !missingTable(statsRes.error),
    matches: data.matches.map((m) => {
      const own = events.filter((e) => e.match_id === m.id);
      return {
        ...m,
        homeTeam: teamName.get(m.homeTeamId) ?? "—",
        awayTeam: teamName.get(m.awayTeamId) ?? "—",
        goals: own.filter((e) => e.kind === "goal").length,
        cards: own.filter((e) => e.kind !== "goal").length,
      };
    }),
  };
}

export type ResultEvent = {
  kind: MatchEventKind;
  teamId: string;
  firstName: string;
  lastName: string;
  minute: number;
};

export type MatchForResult = {
  id: string;
  stage: string;
  kickoff: string;
  clutchMode: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  tournament: { id: string; name: string; slug: string; status: TournamentStatus; matchLength: string };
  home: { id: string; name: string; roster: string[] };
  away: { id: string; name: string; roster: string[] };
  events: ResultEvent[];
};

/** Jeden zápas s událostmi a soupiskami obou týmů (pro nabídku jmen ve formuláři). */
export async function getMatchForResult(matchId: string): Promise<MatchForResult | null> {
  if (!isUuid(matchId)) return null;
  const supabase = await createClient();
  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "id, stage, kickoff, clutch_mode, home_goals, away_goals, home_team_id, away_team_id, tournament:tournaments(id, name, slug, status, match_length)"
    )
    .eq("id", matchId)
    .maybeSingle();
  if (error) throw error;
  if (!match || !match.tournament) return null;

  const [teams, players, events] = await Promise.all([
    supabase.from("teams").select("id, name").in("id", [match.home_team_id, match.away_team_id]),
    supabase
      .from("players")
      .select("team_id, first_name, last_name")
      .in("team_id", [match.home_team_id, match.away_team_id]),
    supabase
      .from("match_events")
      .select("kind, team_id, first_name, last_name, minute")
      .eq("match_id", matchId)
      .order("minute"),
  ]);
  if (teams.error) throw teams.error;
  if (players.error) throw players.error;
  if (events.error) throw events.error;

  const side = (id: string) => ({
    id,
    name: teams.data.find((t) => t.id === id)?.name ?? "—",
    roster: players.data
      .filter((p) => p.team_id === id)
      .map((p) => `${p.first_name} ${p.last_name}`)
      .sort((a, b) => a.localeCompare(b, "cs")),
  });

  return {
    id: match.id,
    stage: match.stage,
    kickoff: match.kickoff,
    clutchMode: match.clutch_mode,
    homeGoals: match.home_goals,
    awayGoals: match.away_goals,
    tournament: {
      id: match.tournament.id,
      name: match.tournament.name,
      slug: match.tournament.slug,
      status: match.tournament.status,
      matchLength: match.tournament.match_length,
    },
    home: side(match.home_team_id),
    away: side(match.away_team_id),
    events: events.data.map((e) => ({
      kind: e.kind,
      teamId: e.team_id,
      firstName: e.first_name,
      lastName: e.last_name,
      minute: e.minute,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Uživatelé                                                                 */
/* -------------------------------------------------------------------------- */

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  team: {
    name: string;
    code: string;
    players: number;
    /** Stav přihlášky na hlavní turnaj; null = na něj přihlášený není. */
    entryStatus: EntryStatus | null;
  } | null;
};

export type AdminUsers = {
  users: AdminUser[];
  /** Hlavní turnaj, ke kterému se vztahuje stav přihlášky u týmů. */
  tournament: AdminTournamentInfo | null;
};

export async function listUsers(): Promise<AdminUsers> {
  const supabase = await createClient();
  const [profiles, teams, tournaments] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("teams").select("id, name, code, owner_id, players(id)"),
    listUpcomingTournaments(),
  ]);
  if (profiles.error) throw profiles.error;
  if (teams.error) throw teams.error;

  const tournament = tournaments[0] ?? null;
  const { data: entries, error } = tournament
    ? await supabase.from("tournament_entries").select("team_id, status").eq("tournament_id", tournament.id)
    : { data: [], error: null };
  if (error) throw error;
  const statusByTeam = new Map(entries.map((e) => [e.team_id, e.status]));
  const teamByOwner = new Map(teams.data.flatMap((t) => (t.owner_id ? [[t.owner_id, t] as const] : [])));

  return {
    tournament,
    users: profiles.data.map((u) => {
      const team = teamByOwner.get(u.id);
      return {
        id: u.id,
        name: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        createdAt: u.created_at,
        team: team
          ? {
              name: team.name,
              code: team.code,
              players: team.players.length,
              entryStatus: statusByTeam.get(team.id) ?? null,
            }
          : null,
      };
    }),
  };
}
