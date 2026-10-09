import type {
  Database,
  EntryStatus,
  MatchEventKind,
  TournamentStatus,
  UserRole,
} from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// Čtení dat pro administraci. Dotazy jdou za přihlášeného admina, takže vidí
// všechno díky politikám „Admin čte …“ v databázi. Kdyby je zavolal někdo
// jiný, RLS mu vrátí prázdný výsledek — kontrola role v UI je jen pohodlí.

type TournamentRow = Database["public"]["Tables"]["tournaments"]["Row"];

/* -------------------------------------------------------------------------- */
/*  Přehled                                                                   */
/* -------------------------------------------------------------------------- */

export type AdminOverview = {
  pendingEntries: number;
  users: number;
  upcoming: { id: string; name: string; startsOn: string; registrationOpen: boolean }[];
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient();
  const [pending, users, upcoming] = await Promise.all([
    supabase.from("tournament_entries").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("tournaments")
      .select("id, name, starts_on, registration_open")
      .eq("status", "upcoming")
      .order("starts_on"),
  ]);
  if (pending.error) throw pending.error;
  if (upcoming.error) throw upcoming.error;

  return {
    pendingEntries: pending.count ?? 0,
    users: users.count ?? 0,
    upcoming: upcoming.data.map((t) => ({
      id: t.id,
      name: t.name,
      startsOn: t.starts_on,
      registrationOpen: t.registration_open,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Přihlášky týmů                                                            */
/* -------------------------------------------------------------------------- */

export type AdminEntry = {
  tournamentId: string;
  tournamentName: string;
  tournamentStatus: TournamentStatus;
  startsOn: string;
  teamId: string;
  teamName: string;
  city: string;
  code: string;
  note: string;
  status: EntryStatus;
  playerCount: number;
  createdAt: string;
  captain: { name: string; email: string; phone: string } | null;
};

/** Všechny přihlášky na turnaje, které ještě nejsou odehrané; čekající nahoře. */
export async function listPendingTournamentEntries(): Promise<AdminEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_entries")
    .select(
      "tournament_id, team_id, status, created_at, tournament:tournaments!inner(name, status, starts_on), team:teams(name, city, code, note, owner_id, players(id))"
    )
    .eq("tournament.status", "upcoming")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ownerIds = [...new Set(data.flatMap((e) => (e.team?.owner_id ? [e.team.owner_id] : [])))];
  const { data: owners, error: ownersError } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", ownerIds)
    : { data: [], error: null };
  if (ownersError) throw ownersError;
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  const entries = data.flatMap((e) => {
    if (!e.team || !e.tournament) return [];
    const owner = e.team.owner_id ? ownerById.get(e.team.owner_id) : undefined;
    const entry: AdminEntry = {
      tournamentId: e.tournament_id,
      tournamentName: e.tournament.name,
      tournamentStatus: e.tournament.status,
      startsOn: e.tournament.starts_on,
      teamId: e.team_id,
      teamName: e.team.name,
      city: e.team.city,
      code: e.team.code,
      note: e.team.note,
      status: e.status,
      playerCount: e.team.players.length,
      createdAt: e.created_at,
      captain: owner ? { name: owner.full_name, email: owner.email, phone: owner.phone } : null,
    };
    return [entry];
  });

  // Čekající nahoře — právě ty organizátor potřebuje vyřídit.
  return entries.sort(
    (a, b) =>
      Number(a.status === "approved") - Number(b.status === "approved") ||
      b.createdAt.localeCompare(a.createdAt)
  );
}

/* -------------------------------------------------------------------------- */
/*  Turnaje                                                                   */
/* -------------------------------------------------------------------------- */

export type AdminTournamentItem = {
  id: string;
  slug: string;
  name: string;
  edition: string;
  startsOn: string;
  status: TournamentStatus;
  registrationOpen: boolean;
};

export async function listTournaments(): Promise<AdminTournamentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, slug, name, edition, starts_on, status, registration_open")
    .order("starts_on", { ascending: false });
  if (error) throw error;
  return data.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    edition: t.edition,
    startsOn: t.starts_on,
    status: t.status,
    registrationOpen: t.registration_open,
  }));
}

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
  tournament: TournamentRow;
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

export type ResultsOverview = {
  tournament: TournamentRow;
  entries: AdminEntryRow[];
  matches: ResultMatchRow[];
};

/** Zápasy turnaje pro výběr k zápisu výsledku + týmy pro umístění a postup. */
export async function getResultsOverview(tournamentId: string): Promise<ResultsOverview | null> {
  const data = await getAdminTournament(tournamentId);
  if (!data) return null;

  const supabase = await createClient();
  const matchIds = data.matches.map((m) => m.id);
  const { data: events, error } = matchIds.length
    ? await supabase.from("match_events").select("match_id, kind").in("match_id", matchIds)
    : { data: [], error: null };
  if (error) throw error;

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
    entries: data.entries,
    matches: data.matches.map((m) => {
      const own = events.filter((e) => e.match_id === m.id);
      return {
        ...m,
        homeTeam: teamName.get(m.homeTeamId) ?? "Neznámý tým",
        awayTeam: teamName.get(m.awayTeamId) ?? "Neznámý tým",
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
    name: teams.data.find((t) => t.id === id)?.name ?? "Neznámý tým",
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
  teamName: string | null;
  createdAt: string;
};

export async function listUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const { data: teams, error: teamsError } = await supabase.from("teams").select("name, owner_id");
  if (teamsError) throw teamsError;
  const teamByOwner = new Map(teams.flatMap((t) => (t.owner_id ? [[t.owner_id, t.name] as const] : [])));

  return data.map((u) => ({
    id: u.id,
    name: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    teamName: teamByOwner.get(u.id) ?? null,
    createdAt: u.created_at,
  }));
}
