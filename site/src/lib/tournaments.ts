// Turnaje Clutch League — čtení ze Supabase a výpočty pro stránky /turnaje.
//
// Funkční princip (převzatý z ligových portálů, ne vzhled): zápasy jsou jediný
// zdroj pravdy o skóre. Tabulka skupiny se z nich dopočítává — viz
// buildTables(). Jakmile organizátor zapíše výsledek, tabulka se přepočítá sama.
// Střelci a karty se počítají z gólů a karet zapsaných u zápasů (match_events);
// starší turnaje bez nich používají ruční seznam střelců (tabulka scorers).
// Když organizátor zapíše statistiky hráčů za celý turnaj (player_stats —
// minuty, góly, karty), mají u daného týmu přednost před zápasy.
// Konečné pořadí a postup ze skupiny generická logika odvodit neumí; zadává je
// organizátor do tournament_entries (final_rank, advanced).
//
// Data čte anonymní klient (jen veřejné údaje, RLS), takže stránky archivu
// zůstávají statické a obnovují se po pár minutách (ISR). Veřejnost vidí jen
// turnaje, které má organizátor v Rozpisu turnajů zobrazené na webu.

import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { formatTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { missingTable } from "@/lib/supabase/errors";
import type { MatchEventKind } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";
import {
  compareTournaments,
  startTimeOf,
  tournamentPhase,
  tournamentSummaries,
  type TournamentPhase,
} from "@/lib/tournamentModel";

export type MatchOutcome = "W" | "D" | "L";

export type TournamentTeam = {
  id: string;
  name: string;
  city: string;
  /** Skupina ve skupinové fázi. Chybí u turnajů hraných v jedné skupině. */
  group?: string;
  /** Organizátor označil, že tým postoupil ze skupiny. */
  advanced?: boolean;
};

/** Gól nebo karta zapsaná u zápasu. */
export type MatchEvent = {
  kind: MatchEventKind;
  teamId: string;
  player: string;
  minute: number;
};

export type TournamentMatch = {
  id: string;
  /** "Skupina A", "Semifinále", "O 3. místo", "Finále". */
  stage: string;
  /** Zápasy skupinové fáze se počítají do tabulky, play-off ne. */
  countsForTable: boolean;
  time: string;
  homeId: string;
  awayId: string;
  /** Null = zápas ještě nemá zapsaný výsledek. */
  homeGoals: number | null;
  awayGoals: number | null;
  /** Mód, který padl na kostce v Clutch Time (poslední 3 minuty). */
  clutchMode?: string;
  /** Góly a karty seřazené podle minuty. Prázdné, když je organizátor nerozepsal. */
  events: MatchEvent[];
};

export type Scorer = {
  player: string;
  teamId: string;
  goals: number;
};

export type CardStat = {
  player: string;
  teamId: string;
  yellow: number;
  red: number;
};

/** Statistika hráče za celý turnaj (zapsaná organizátorem v kartě týmu). */
export type PlayerStat = {
  player: string;
  number: number | null;
  teamId: string;
  /** Null = tým nemá statistiky zapsané, góly a karty jsou spočítané ze zápasů. */
  minutes: number | null;
  goals: number;
  yellow: number;
  red: number;
};

export type Award = {
  player: string;
  teamId: string;
};

export type Tournament = {
  slug: string;
  name: string;
  /** "Léto 2026" — sezónní označení pro přehled. */
  edition: string;
  /** Datum "RRRR-MM-DD" — formátuje se podle jazyka stránky (formatDate). */
  dateIso: string;
  venue: string;
  format: string;
  matchLength: string;
  /** Popis po jazycích (pro vyhledávače); prázdný = v tom jazyce se neukáže. */
  summary: Record<Locale, string>;
  /** Náhled v přehledu turnajů. Volitelný — bez fotky se vykreslí rastr. */
  photo?: { src: string; alt: string };
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  /** Konečné pořadí, od vítěze (týmy se zadaným pořadím). */
  finalRanking: string[];
  scorers: Scorer[];
  /** True = střelci jsou spočítaní z gólů u zápasů, ne z ručního seznamu. */
  scorersFromMatches: boolean;
  cards: CardStat[];
  /**
   * Statistiky hráčů (minuty, góly, karty). Prázdné, dokud je organizátor
   * nezapíše; pak se z nich počítají i střelci a karty.
   */
  playerStats: PlayerStat[];
  mvp?: Award;
  bestKeeper?: Award;
};

/** Zápas z rozpisu nadcházejícího turnaje. */
export type ScheduledMatch = {
  id: string;
  /** "Skupina A", "Finále" — překládá se přes stageLabel(). */
  stage: string;
  /** Výkop (ISO). */
  kickoff: string;
  /** Název týmu; "—", když tým není veřejně vidět (neschválená přihláška). */
  home: string;
  away: string;
  /** Null = zápas ještě nemá zapsaný výsledek. */
  homeGoals: number | null;
  awayGoals: number | null;
};

/** Nadcházející nebo probíhající turnaj z Rozpisu turnajů (veřejná data). */
export type ActiveTournament = {
  id: string;
  name: string;
  /** Datum "RRRR-MM-DD" — formátuje se podle jazyka stránky. */
  dateIso: string;
  /** Čas začátku "HH:MM" (pražský čas); null = organizátor ho nezadal. */
  startTime: string | null;
  venue: string;
  format: string;
  /** Popis po jazycích; prázdný = v tom jazyce se neukáže. */
  summary: Record<Locale, string>;
  phase: TournamentPhase;
  registrationOpen: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Čtení z databáze                                                          */
/* -------------------------------------------------------------------------- */

async function loadCompleted(slug?: string): Promise<Tournament[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();

  let query = supabase
    .from("tournaments")
    .select("*")
    .eq("status", "completed")
    .order("starts_on", { ascending: false });
  if (slug) query = query.eq("slug", slug);

  const { data: rows, error } = await query;
  if (error) throw error;
  if (rows.length === 0) return [];

  const ids = rows.map((t) => t.id);
  const [entries, matches, scorers, stats] = await Promise.all([
    supabase
      .from("tournament_entries")
      .select("tournament_id, team_id, group_label, final_rank, advanced")
      .in("tournament_id", ids),
    supabase
      .from("matches")
      .select(
        "id, tournament_id, stage, counts_for_table, kickoff, home_team_id, away_team_id, home_goals, away_goals, clutch_mode, events:match_events(kind, team_id, first_name, last_name, minute)"
      )
      .in("tournament_id", ids)
      .order("kickoff"),
    supabase.from("scorers").select("tournament_id, team_id, player_name, goals").in("tournament_id", ids),
    supabase
      .from("player_stats")
      .select("id, tournament_id, team_id, first_name, last_name, shirt_number, minutes, goals, yellow_cards, red_cards")
      .in("tournament_id", ids),
  ]);
  if (entries.error) throw entries.error;
  if (matches.error) throw matches.error;
  if (scorers.error) throw scorers.error;
  // Bez migrace č. 9 tabulka statistik chybí — turnaj se ukáže bez nich.
  if (stats.error && !missingTable(stats.error)) throw stats.error;

  // Veřejně jsou vidět jen týmy se schválenou přihláškou (RLS).
  const teamIds = [...new Set(entries.data.map((e) => e.team_id))];
  const { data: teams, error: teamsError } = teamIds.length
    ? await supabase.from("teams").select("id, name, city").in("id", teamIds)
    : { data: [], error: null };
  if (teamsError) throw teamsError;
  const teamById = new Map(teams.map((t) => [t.id, t]));

  return rows.map((t) => {
    const ownEntries = entries.data.filter((e) => e.tournament_id === t.id);
    const tournamentTeams: TournamentTeam[] = ownEntries.flatMap((e) => {
      const team = teamById.get(e.team_id);
      return team ? [{ ...team, group: e.group_label ?? undefined, advanced: e.advanced }] : [];
    });

    const ranked = ownEntries
      .filter((e) => e.final_rank !== null)
      .sort((a, b) => (a.final_rank ?? 0) - (b.final_rank ?? 0))
      .map((e) => e.team_id);

    const ownMatches: TournamentMatch[] = matches.data
      .filter((m) => m.tournament_id === t.id)
      .map((m) => ({
        id: m.id,
        stage: m.stage,
        countsForTable: m.counts_for_table,
        time: formatTime(m.kickoff),
        homeId: m.home_team_id,
        awayId: m.away_team_id,
        homeGoals: m.home_goals,
        awayGoals: m.away_goals,
        clutchMode: m.clutch_mode ?? undefined,
        events: m.events
          .map((e) => ({
            kind: e.kind,
            teamId: e.team_id,
            player: `${e.first_name} ${e.last_name}`,
            minute: e.minute,
          }))
          .sort((a, b) => a.minute - b.minute),
      }));
    const fromMatches = scorersFromEvents(ownMatches);
    const playerStats = mergePlayerStats(
      (stats.data ?? []).filter((s) => s.tournament_id === t.id),
      ownMatches
    );

    return {
      slug: t.slug,
      name: t.name,
      edition: t.edition,
      dateIso: t.starts_on,
      venue: t.venue,
      format: t.format,
      matchLength: t.match_length,
      summary: tournamentSummaries(t),
      photo: t.photo_src ? { src: t.photo_src, alt: t.photo_alt ?? "" } : undefined,
      teams: tournamentTeams,
      matches: ownMatches,
      finalRanking: ranked,
      scorers: playerStats.length
        ? playerStats.filter((p) => p.goals > 0).map((p) => ({ player: p.player, teamId: p.teamId, goals: p.goals }))
        : fromMatches.length > 0
          ? fromMatches
          : scorers.data
              .filter((s) => s.tournament_id === t.id)
              .map((s) => ({ player: s.player_name, teamId: s.team_id, goals: s.goals })),
      scorersFromMatches: !playerStats.length && fromMatches.length > 0,
      cards: playerStats.length
        ? playerStats
            .filter((p) => p.yellow || p.red)
            .map((p) => ({ player: p.player, teamId: p.teamId, yellow: p.yellow, red: p.red }))
            .sort((a, b) => b.red - a.red || b.yellow - a.yellow || a.player.localeCompare(b.player, "cs"))
        : cardsFromEvents(ownMatches),
      playerStats,
      mvp:
        t.mvp_player && t.mvp_team_id ? { player: t.mvp_player, teamId: t.mvp_team_id } : undefined,
      bestKeeper:
        t.best_keeper_player && t.best_keeper_team_id
          ? { player: t.best_keeper_player, teamId: t.best_keeper_team_id }
          : undefined,
    };
  });
}

/** Klíč hráče: stejné jméno ve stejném týmu = stejný hráč (bez ohledu na velikost písmen). */
const playerKey = (teamId: string, player: string) => `${teamId}|${player.toLocaleLowerCase("cs")}`;

/** Tabulka střelců z gólů zapsaných u zápasů. */
function scorersFromEvents(matches: TournamentMatch[]): Scorer[] {
  const byPlayer = new Map<string, Scorer>();
  for (const e of matches.flatMap((m) => m.events)) {
    if (e.kind !== "goal") continue;
    const key = playerKey(e.teamId, e.player);
    const row = byPlayer.get(key);
    if (row) row.goals++;
    else byPlayer.set(key, { player: e.player, teamId: e.teamId, goals: 1 });
  }
  return [...byPlayer.values()].sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player, "cs"));
}

type PlayerStatRow = {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  shirt_number: number | null;
  minutes: number;
  goals: number;
  yellow_cards: number;
  red_cards: number;
};

/**
 * Statistiky hráčů turnaje. Tým, kterému je organizátor zapsal, má hodnoty
 * z nich; ostatní týmy góly a karty ze zápasů (bez minut). Bez jediné zapsané
 * statistiky vrací prázdný seznam — stránka pak ukáže střelce a karty jako dřív.
 * Hráči se samými nulami se vynechají.
 */
function mergePlayerStats(rows: PlayerStatRow[], matches: TournamentMatch[]): PlayerStat[] {
  if (rows.length === 0) return [];
  const savedTeams = new Set(rows.map((r) => r.team_id));
  const byPlayer = new Map<string, PlayerStat>();

  // Uložené řádky podle id — dva hráči týmu se stejným jménem zůstanou zvlášť.
  for (const r of rows) {
    byPlayer.set(r.id, {
      player: `${r.first_name} ${r.last_name}`,
      number: r.shirt_number,
      teamId: r.team_id,
      minutes: r.minutes,
      goals: r.goals,
      yellow: r.yellow_cards,
      red: r.red_cards,
    });
  }
  for (const e of matches.flatMap((m) => m.events)) {
    if (savedTeams.has(e.teamId)) continue;
    const key = playerKey(e.teamId, e.player);
    const row = byPlayer.get(key) ?? {
      player: e.player,
      number: null,
      teamId: e.teamId,
      minutes: null,
      goals: 0,
      yellow: 0,
      red: 0,
    };
    if (e.kind === "goal") row.goals++;
    else if (e.kind === "yellow_card") row.yellow++;
    else row.red++;
    byPlayer.set(key, row);
  }

  return [...byPlayer.values()]
    .filter((p) => p.minutes || p.goals || p.yellow || p.red)
    .sort(
      (a, b) =>
        b.goals - a.goals || (b.minutes ?? 0) - (a.minutes ?? 0) || a.player.localeCompare(b.player, "cs")
    );
}

/** Žluté a červené karty po hráčích. */
function cardsFromEvents(matches: TournamentMatch[]): CardStat[] {
  const byPlayer = new Map<string, CardStat>();
  for (const e of matches.flatMap((m) => m.events)) {
    if (e.kind === "goal") continue;
    const key = playerKey(e.teamId, e.player);
    const row = byPlayer.get(key) ?? { player: e.player, teamId: e.teamId, yellow: 0, red: 0 };
    if (e.kind === "yellow_card") row.yellow++;
    else row.red++;
    byPlayer.set(key, row);
  }
  return [...byPlayer.values()].sort(
    (a, b) => b.red - a.red || b.yellow - a.yellow || a.player.localeCompare(b.player, "cs")
  );
}

/** Odehrané turnaje, od nejnovějšího. */
export async function getTournaments(): Promise<Tournament[]> {
  return loadCompleted();
}

/** cache(): metadata i stránka detailu si turnaj načtou jen jednou na požadavek. */
export const getTournament = cache(async (slug: string): Promise<Tournament | undefined> => {
  return (await loadCompleted(slug))[0];
});

/**
 * Turnaje, které ještě nejsou odehrané (Rozpis turnajů v administraci), v pořadí
 * pro web: probíhající, pak nadcházející od nejbližšího. Veřejný klient vidí jen
 * turnaje zobrazené na webu (RLS, migrace č. 10). Bez databáze prázdný seznam.
 * cache(): úvodní stránka (kampaň i seznam dalších turnajů) čte jen jednou.
 */
export const getActiveTournaments = cache(async (): Promise<ActiveTournament[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createPublicClient()
    .from("tournaments")
    // "*": funguje i před migrací č. 10 (bez času, popisu v jazycích a zobrazení).
    .select("*")
    .neq("status", "completed");
  if (error) throw error;

  return data
    .sort((a, b) => compareTournaments({ status: a.status, startsOn: a.starts_on }, { status: b.status, startsOn: b.starts_on }))
    .map((t) => ({
      id: t.id,
      name: t.name,
      dateIso: t.starts_on,
      startTime: startTimeOf(t),
      venue: t.venue,
      format: t.format,
      summary: tournamentSummaries(t),
      phase: tournamentPhase(t.status, t.registration_open),
      registrationOpen: t.registration_open,
    }));
});

/** Rozpis zápasů turnaje podle výkopu. Prázdný, dokud ho organizátor nezadá. */
export async function getTournamentSchedule(tournamentId: string): Promise<ScheduledMatch[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, stage, kickoff, home_team_id, away_team_id, home_goals, away_goals")
    .eq("tournament_id", tournamentId)
    .order("kickoff");
  if (error) throw error;

  // Veřejně jsou vidět jen týmy se schválenou přihláškou (RLS).
  const teamIds = [...new Set(matches.flatMap((m) => [m.home_team_id, m.away_team_id]))];
  const { data: teams, error: teamsError } = teamIds.length
    ? await supabase.from("teams").select("id, name").in("id", teamIds)
    : { data: [], error: null };
  if (teamsError) throw teamsError;
  const teamName = new Map(teams.map((t) => [t.id, t.name]));

  return matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    kickoff: m.kickoff,
    home: teamName.get(m.home_team_id) ?? "—",
    away: teamName.get(m.away_team_id) ?? "—",
    homeGoals: m.home_goals,
    awayGoals: m.away_goals,
  }));
}

export function findTeam(tournament: Tournament, teamId: string): TournamentTeam {
  return (
    tournament.teams.find((t) => t.id === teamId) ?? {
      id: teamId,
      // Neznámý tým (smazaný, neschválený) — neutrální znak ve všech jazycích.
      name: "—",
      city: "",
    }
  );
}

/* -------------------------------------------------------------------------- */
/*  Odvozené statistiky                                                       */
/* -------------------------------------------------------------------------- */

export type TableRow = {
  rank: number;
  team: TournamentTeam;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  /** Výsledky v pořadí, v jakém se hrály. */
  form: MatchOutcome[];
};

export type TableGroup = {
  /** Název skupiny, nebo prázdný řetězec u turnaje bez skupin. */
  group: string;
  rows: TableRow[];
};

const POINTS = { win: 3, draw: 1, loss: 0 };

/**
 * Dopočítá tabulky ze zápasů skupinové fáze — stejný princip, jaký používají
 * ligové portály: zadá se výsledek, pořadí se přepočítá samo.
 * Pořadí: body → rozdíl skóre → vstřelené góly → název týmu.
 */
export function buildTables(tournament: Tournament): TableGroup[] {
  const groups = new Map<string, TournamentTeam[]>();
  for (const t of tournament.teams) {
    const key = t.group ?? "";
    const list = groups.get(key);
    if (list) list.push(t);
    else groups.set(key, [t]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "cs"))
    .map(([group, teams]) => {
      const byId = new Map<string, TableRow>(
        teams.map((team) => [
          team.id,
          {
            rank: 0,
            team,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDiff: 0,
            points: 0,
            form: [],
          },
        ])
      );

      for (const match of tournament.matches) {
        if (!match.countsForTable || match.homeGoals === null || match.awayGoals === null) continue;
        const home = byId.get(match.homeId);
        const away = byId.get(match.awayId);
        // Zápas patří do téhle skupiny jen když v ní jsou oba týmy.
        if (!home || !away) continue;

        home.played++;
        away.played++;
        home.goalsFor += match.homeGoals;
        home.goalsAgainst += match.awayGoals;
        away.goalsFor += match.awayGoals;
        away.goalsAgainst += match.homeGoals;

        if (match.homeGoals > match.awayGoals) {
          home.wins++;
          away.losses++;
          home.points += POINTS.win;
          away.points += POINTS.loss;
          home.form.push("W");
          away.form.push("L");
        } else if (match.homeGoals < match.awayGoals) {
          away.wins++;
          home.losses++;
          away.points += POINTS.win;
          home.points += POINTS.loss;
          away.form.push("W");
          home.form.push("L");
        } else {
          home.draws++;
          away.draws++;
          home.points += POINTS.draw;
          away.points += POINTS.draw;
          home.form.push("D");
          away.form.push("D");
        }
      }

      const rows = [...byId.values()]
        .map((row) => ({ ...row, goalDiff: row.goalsFor - row.goalsAgainst }))
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.goalDiff - a.goalDiff ||
            b.goalsFor - a.goalsFor ||
            a.team.name.localeCompare(b.team.name, "cs")
        )
        .map((row, i) => ({ ...row, rank: i + 1 }));

      return { group, rows };
    });
}

/** Konečné pořadí turnaje — medailová místa i zbytek startovního pole. */
export function finalStandings(
  tournament: Tournament
): { rank: number; team: TournamentTeam }[] {
  return tournament.finalRanking.map((teamId, i) => ({
    rank: i + 1,
    team: findTeam(tournament, teamId),
  }));
}

/** Týmy, které hrály, ale konečné pořadí nemají (organizátor ho nezná). Podle názvu. */
export function unrankedTeams(tournament: Tournament): TournamentTeam[] {
  const ranked = new Set(tournament.finalRanking);
  return tournament.teams
    .filter((t) => !ranked.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name, "cs"));
}

export function winner(tournament: Tournament): TournamentTeam | undefined {
  const first = tournament.finalRanking[0];
  return first ? findTeam(tournament, first) : undefined;
}

export function topScorer(tournament: Tournament): Scorer | undefined {
  return [...tournament.scorers].sort((a, b) => b.goals - a.goals)[0];
}

/** Zápasy seskupené podle fáze, v pořadí, v jakém se poprvé objeví. */
export function matchesByStage(
  tournament: Tournament
): { stage: string; matches: TournamentMatch[] }[] {
  const stages = new Map<string, TournamentMatch[]>();
  for (const match of tournament.matches) {
    const list = stages.get(match.stage);
    if (list) list.push(match);
    else stages.set(match.stage, [match]);
  }
  return [...stages.entries()].map(([stage, matches]) => ({ stage, matches }));
}

export function tournamentSummaryStats(tournament: Tournament) {
  const played = tournament.matches.filter((m) => m.homeGoals !== null && m.awayGoals !== null);
  const goals = played.reduce((sum, m) => sum + (m.homeGoals ?? 0) + (m.awayGoals ?? 0), 0);
  return {
    teams: tournament.teams.length,
    matches: tournament.matches.length,
    goals,
    // Karty po hráčích — ze zápasů, nebo ze statistik hráčů, když je organizátor zapsal.
    yellowCards: tournament.cards.reduce((sum, c) => sum + c.yellow, 0),
    redCards: tournament.cards.reduce((sum, c) => sum + c.red, 0),
    /** Formátuje se podle jazyka (formatDecimal). */
    goalsPerMatch: played.length ? goals / played.length : 0,
  };
}
