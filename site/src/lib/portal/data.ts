import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_MAX_ROSTER,
  type CaptainEntry,
  type Entry,
  type OpenTournament,
  type Player,
  type Team,
  type TeamMatch,
} from "./types";

// Přístup k datům portálu v Supabase. Dotazy jdou za přihlášeného uživatele,
// takže co smí vidět a měnit, rozhoduje RLS v databázi — tady se nic
// neověřuje znovu. Jen pro server: importuj ze server komponent a akcí.

type PlayerRow = Pick<
  Database["public"]["Tables"]["players"]["Row"],
  "id" | "first_name" | "last_name" | "shirt_number" | "position" | "birth_year" | "is_captain"
>;

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    number: row.shirt_number,
    position: row.position,
    birthYear: row.birth_year,
    captain: row.is_captain,
  };
}

/** Výsledek zápisu: chyba z databáze, nebo nic. */
export type WriteResult = { error: PostgrestError | null };

const NOTHING_CHANGED: PostgrestError = {
  name: "PostgrestError",
  code: "42501",
  message: "Nothing changed — row not found or not allowed",
  details: "",
  hint: "",
} as PostgrestError;

/* -------------------------------------------------------------------------- */
/*  Turnaj s otevřenou registrací                                             */
/* -------------------------------------------------------------------------- */

export async function getOpenTournament(): Promise<OpenTournament | null> {
  const { data, error } = await createPublicClient()
    .from("tournaments")
    // "*": web funguje i před migrací 20261013120000 (bez sloupce max_roster).
    .select("*")
    .eq("registration_open", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    startsOn: data.starts_on,
    format: data.format,
    minRoster: data.min_roster,
    maxRoster: data.max_roster ?? DEFAULT_MAX_ROSTER,
  };
}

/* -------------------------------------------------------------------------- */
/*  Tým kapitána                                                              */
/* -------------------------------------------------------------------------- */

export async function getCaptainTeam(userId: string): Promise<Team | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select(
      "id, code, name, city, founded_year, colors, note, players(id, first_name, last_name, shirt_number, position, birth_year, is_captain)"
    )
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    code: data.code,
    name: data.name,
    city: data.city,
    foundedYear: data.founded_year,
    colors: data.colors,
    note: data.note,
    players: data.players.map(toPlayer),
  };
}

type EntryRow = Database["public"]["Tables"]["tournament_entries"]["Row"];

function toEntry(row: EntryRow): Entry {
  return {
    tournamentId: row.tournament_id,
    status: row.status,
    // Před migrací č. 8 sloupce chybí.
    statusNote: row.status_note ?? "",
    statusChangedAt: row.status_changed_at ?? null,
    createdAt: row.created_at,
  };
}

/** Přihláška týmu na daný turnaj, nebo null. */
export async function getTeamEntry(teamId: string, tournamentId: string): Promise<Entry | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_entries")
    // "*": funguje i před migrací č. 8 (bez důvodu a času rozhodnutí).
    .select("*")
    .eq("team_id", teamId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();
  if (error) throw error;
  return data ? toEntry(data) : null;
}

/**
 * Přihlášky týmu na nadcházející turnaje — nejdřív turnaj s otevřenými
 * přihláškami, pak podle data. Kapitán tak vidí stav přihlášky i po uzávěrce.
 */
export async function getCaptainEntries(teamId: string): Promise<CaptainEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_entries")
    .select("*, tournament:tournaments!inner(*)")
    .eq("team_id", teamId)
    .eq("tournament.status", "upcoming");
  if (error) throw error;

  return data
    .flatMap((row) => {
      const t = row.tournament;
      if (!t) return [];
      return [
        {
          ...toEntry(row),
          tournament: {
            id: t.id,
            name: t.name,
            startsOn: t.starts_on,
            format: t.format,
            minRoster: t.min_roster,
            maxRoster: t.max_roster ?? DEFAULT_MAX_ROSTER,
            registrationOpen: t.registration_open,
          },
        } satisfies CaptainEntry,
      ];
    })
    .sort(
      (a, b) =>
        Number(b.tournament.registrationOpen) - Number(a.tournament.registrationOpen) ||
        a.tournament.startsOn.localeCompare(b.tournament.startsOn)
    );
}

/**
 * Zápasy týmu v rozpisu turnaje. Rozpis je veřejný, čte se veřejným klientem;
 * soupeři bez schválené přihlášky jsou „—“ (stejně jako na webu).
 */
export async function getTeamSchedule(teamId: string, tournamentId: string): Promise<TeamMatch[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, stage, kickoff, home_team_id, away_team_id, home_goals, away_goals")
    .eq("tournament_id", tournamentId)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("kickoff");
  if (error) throw error;
  if (data.length === 0) return [];

  const ids = [...new Set(data.flatMap((m) => [m.home_team_id, m.away_team_id]))];
  const { data: teams } = await supabase.from("teams").select("id, name").in("id", ids);
  const name = new Map((teams ?? []).map((t) => [t.id, t.name]));

  return data.map((m) => ({
    id: m.id,
    stage: m.stage,
    kickoff: m.kickoff,
    home: name.get(m.home_team_id) ?? "—",
    away: name.get(m.away_team_id) ?? "—",
    isHome: m.home_team_id === teamId,
    homeGoals: m.home_goals,
    awayGoals: m.away_goals,
  }));
}

export type TeamInput = {
  name: string;
  city: string;
  foundedYear: number | null;
  colors: string;
  note: string;
};

/** Nový tým + přihláška na otevřený turnaj v jedné transakci (RPC register_team). */
export async function registerTeam(input: TeamInput): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("register_team", {
    p_name: input.name,
    p_city: input.city,
    p_founded_year: input.foundedYear,
    p_colors: input.colors,
    p_note: input.note,
  });
  return { error };
}

/** Přihláška už existujícího týmu na otevřený turnaj. */
export async function enterTournament(teamId: string, tournamentId: string): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_entries")
    .insert({ team_id: teamId, tournament_id: tournamentId });
  return { error };
}

/**
 * Odhlášení týmu z turnaje. Databáze ho pustí jen při otevřených přihláškách
 * a dokud tým nemá v turnaji zápas — jinak smaže 0 řádků (removed = false).
 */
export async function withdrawEntry(
  teamId: string,
  tournamentId: string
): Promise<WriteResult & { removed: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_entries")
    .delete()
    .eq("team_id", teamId)
    .eq("tournament_id", tournamentId)
    .select("team_id");
  return { error, removed: (data?.length ?? 0) > 0 };
}

export async function updateTeam(teamId: string, input: TeamInput): Promise<WriteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .update({
      name: input.name,
      city: input.city,
      founded_year: input.foundedYear,
      colors: input.colors,
      note: input.note,
    })
    .eq("id", teamId)
    .select("id");
  // RLS cizí řádek tiše vynechá — prázdný výsledek znamená „nesmíš“.
  return { error: error ?? (data.length ? null : NOTHING_CHANGED) };
}

/* -------------------------------------------------------------------------- */
/*  Hráči                                                                     */
/* -------------------------------------------------------------------------- */

export type PlayerInput = Omit<Player, "id">;

function playerColumns(input: PlayerInput) {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    shirt_number: input.number,
    position: input.position,
    birth_year: input.birthYear,
    is_captain: input.captain,
  };
}

/**
 * Kapitán na hřišti je v týmu jen jeden (hlídá to i unikátní index), takže
 * před označením nového se starému příznak sundá.
 */
async function clearFieldCaptain(teamId: string, exceptPlayerId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("players")
    .update({ is_captain: false })
    .eq("team_id", teamId)
    .eq("is_captain", true);
  if (exceptPlayerId) query = query.neq("id", exceptPlayerId);
  return query;
}

export async function addPlayer(teamId: string, input: PlayerInput): Promise<WriteResult> {
  if (input.captain) {
    const { error } = await clearFieldCaptain(teamId);
    if (error) return { error };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("players").insert({ team_id: teamId, ...playerColumns(input) });
  return { error };
}

export async function updatePlayer(
  teamId: string,
  playerId: string,
  input: PlayerInput
): Promise<WriteResult> {
  if (input.captain) {
    const { error } = await clearFieldCaptain(teamId, playerId);
    if (error) return { error };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .update(playerColumns(input))
    .eq("id", playerId)
    .eq("team_id", teamId)
    .select("id");
  return { error: error ?? (data.length ? null : NOTHING_CHANGED) };
}

export async function removePlayer(teamId: string, playerId: string): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", playerId).eq("team_id", teamId);
  return { error };
}
