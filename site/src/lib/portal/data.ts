import type { PostgrestError } from "@supabase/supabase-js";
import { formatDate } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { Entry, OpenTournament, Player, Team } from "./types";

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
    .select("id, name, starts_on, format, min_roster")
    .eq("registration_open", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    dateLabel: formatDate(data.starts_on),
    format: data.format,
    minRoster: data.min_roster,
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

/** Přihláška týmu na daný turnaj, nebo null. */
export async function getTeamEntry(teamId: string, tournamentId: string): Promise<Entry | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_entries")
    .select("tournament_id, status")
    .eq("team_id", teamId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();
  if (error) throw error;
  return data ? { tournamentId: data.tournament_id, status: data.status } : null;
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
