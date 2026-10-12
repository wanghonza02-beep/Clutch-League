import { pragueIsoDay } from "@/lib/format";
import type {
  Database,
  EntryStatus,
  MatchEventKind,
  PlayerPosition,
  TournamentStatus,
  UserRole,
} from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// Čtení dat pro administraci. Dotazy jdou za přihlášeného admina, takže vidí
// všechno díky politikám „Admin čte …“ v databázi. Kdyby je zavolal někdo
// jiný, RLS mu vrátí prázdný výsledek — kontrola role v UI je jen pohodlí.

type TournamentRow = Database["public"]["Tables"]["tournaments"]["Row"];

/* -------------------------------------------------------------------------- */
/*  Hlavní turnaj                                                             */
/* -------------------------------------------------------------------------- */

/** Nadcházející turnaj, jak ho potřebuje administrace. */
export type AdminTournamentInfo = {
  id: string;
  name: string;
  startsOn: string;
  registrationOpen: boolean;
  format: string;
  minRoster: number;
  maxRoster: number;
};

function toTournamentInfo(t: TournamentRow): AdminTournamentInfo {
  return {
    id: t.id,
    name: t.name,
    startsOn: t.starts_on,
    registrationOpen: t.registration_open,
    format: t.format,
    minRoster: t.min_roster,
    // Před migrací č. 7 sloupec chybí — stejný výchozí limit jako v databázi.
    maxRoster: t.max_roster ?? 10,
  };
}

/**
 * Nadcházející turnaje: nejdřív ten s otevřenými přihláškami, pak podle data.
 * První z nich je „hlavní turnaj“ — na něj se dívá přehled i seznam uživatelů.
 */
export async function listUpcomingTournaments(): Promise<AdminTournamentInfo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    // "*": funguje i bez sloupců z novějších migrací.
    .select("*")
    .eq("status", "upcoming")
    .order("starts_on");
  if (error) throw error;
  return data
    .map(toTournamentInfo)
    .sort((a, b) => Number(b.registrationOpen) - Number(a.registrationOpen) || a.startsOn.localeCompare(b.startsOn));
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
};

export type AdminEntryGroup = {
  tournament: AdminTournamentInfo;
  counts: Record<EntryStatus, number>;
  entries: AdminEntry[];
};

const STATUS_ORDER: Record<EntryStatus, number> = { pending: 0, approved: 1, rejected: 2 };

/**
 * Přihlášky na nadcházející turnaje, po turnajích. Turnaj s otevřenými
 * přihláškami je vždy v seznamu, i když se na něj ještě nikdo nepřihlásil.
 * V turnaji: čekající nahoře (nejstarší první — kdo dřív přišel), pak
 * schválené podle názvu, zamítnuté nakonec.
 */
export async function listEntryGroups(): Promise<AdminEntryGroup[]> {
  const tournaments = await listUpcomingTournaments();
  if (tournaments.length === 0) return [];

  const supabase = await createClient();
  const ids = tournaments.map((t) => t.id);
  const [entries, matches] = await Promise.all([
    supabase
      .from("tournament_entries")
      .select(
        "*, team:teams(name, city, colors, code, note, owner_id, players(first_name, last_name, shirt_number, position, birth_year, is_captain))"
      )
      .in("tournament_id", ids),
    supabase.from("matches").select("tournament_id, home_team_id, away_team_id, home_goals").in("tournament_id", ids),
  ]);
  if (entries.error) throw entries.error;
  if (matches.error) throw matches.error;

  const ownerIds = [...new Set(entries.data.flatMap((e) => (e.team?.owner_id ? [e.team.owner_id] : [])))];
  const { data: owners, error: ownersError } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", ownerIds)
    : { data: [], error: null };
  if (ownersError) throw ownersError;
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  const rows: AdminEntry[] = entries.data.flatMap((e) => {
    if (!e.team) return [];
    const owner = e.team.owner_id ? ownerById.get(e.team.owner_id) : undefined;
    const own = matches.data.filter(
      (m) => m.tournament_id === e.tournament_id && (m.home_team_id === e.team_id || m.away_team_id === e.team_id)
    );
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
      },
    ];
  });

  return tournaments.map((tournament) => {
    const own = rows
      .filter((r) => r.tournamentId === tournament.id)
      .sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          (a.status === "pending"
            ? a.createdAt.localeCompare(b.createdAt)
            : a.status === "rejected"
              ? (b.statusChangedAt ?? "").localeCompare(a.statusChangedAt ?? "")
              : a.teamName.localeCompare(b.teamName, "cs"))
      );
    const counts: Record<EntryStatus, number> = { pending: 0, approved: 0, rejected: 0 };
    for (const r of own) counts[r.status]++;
    return { tournament, counts, entries: own };
  });
}

/** Čekající přihlášky na nadcházející turnaje (odznak v liště). */
export async function countPendingEntries(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("tournament_entries")
    .select("team_id, tournament:tournaments!inner(status)", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("tournament.status", "upcoming");
  if (error) {
    console.error("[admin] počet čekajících přihlášek", error.code, error.message);
    return 0;
  }
  return count ?? 0;
}

/* -------------------------------------------------------------------------- */
/*  Přehled                                                                   */
/* -------------------------------------------------------------------------- */

export type AdminOverview = {
  /** Hlavní turnaj (otevřené přihlášky, jinak nejbližší) a jeho stav. */
  focus: {
    group: AdminEntryGroup;
    /** Hráči ve schválených týmech. */
    players: number;
    /** Schválené a čekající týmy, jejichž soupiska nesplňuje limity turnaje. */
    rosterIssues: { teamId: string; teamName: string; players: number }[];
    matches: number;
    played: number;
    /** Zápasy, které k turnaji nesedí (jiný den, tým bez schválené přihlášky). */
    matchIssues: number;
    /** Zápasy po výkopu bez zapsaného výsledku. */
    resultsMissing: number;
  } | null;
  /** Další nadcházející turnaje. */
  others: AdminEntryGroup[];
  /** Čekající přihlášky na všech nadcházejících turnajích. */
  pendingTotal: number;
  users: number;
  /** Kapitáni s účtem, ale bez týmu — nedokončili přihlášku. */
  captainsWithoutTeam: number;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient();
  const [groups, profiles, teams] = await Promise.all([
    listEntryGroups(),
    supabase.from("profiles").select("id, role"),
    supabase.from("teams").select("owner_id"),
  ]);
  if (profiles.error) throw profiles.error;
  if (teams.error) throw teams.error;

  const owners = new Set(teams.data.flatMap((t) => (t.owner_id ? [t.owner_id] : [])));
  const captainsWithoutTeam = profiles.data.filter((p) => p.role === "captain" && !owners.has(p.id)).length;
  const pendingTotal = groups.reduce((sum, g) => sum + g.counts.pending, 0);

  const [focusGroup, ...others] = groups;
  if (!focusGroup) {
    return { focus: null, others: [], pendingTotal, users: profiles.data.length, captainsWithoutTeam };
  }

  const { tournament } = focusGroup;
  const { data: matches, error } = await supabase
    .from("matches")
    .select("kickoff, home_team_id, away_team_id, home_goals")
    .eq("tournament_id", tournament.id);
  if (error) throw error;

  const approved = new Set(focusGroup.entries.filter((e) => e.status === "approved").map((e) => e.teamId));
  const now = Date.now();

  return {
    focus: {
      group: focusGroup,
      players: focusGroup.entries
        .filter((e) => e.status === "approved")
        .reduce((sum, e) => sum + e.players.length, 0),
      rosterIssues: focusGroup.entries
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
    },
    others,
    pendingTotal,
    users: profiles.data.length,
    captainsWithoutTeam,
  };
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
