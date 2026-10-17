import type { NotificationKind } from "@/lib/supabase/database.types";
import { missingTable } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

// Oznámení pro přihlášeného uživatele (tabulka notifications, migrace č. 8).
// Vznikají v databázi samy (triggery na přihláškách) — web je jen čte a
// označuje jako přečtená. RLS pustí každého jen k jeho vlastním.
//
// Dokud migrace č. 8 v Supabase neběží, tabulka neexistuje: web pak oznámení
// prostě neukazuje (nespadne).

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  tournamentId: string | null;
  tournamentName: string;
  teamId: string | null;
  teamName: string;
  /** Důvod zamítnutí (entry_rejected), jinak prázdné. */
  note: string;
  createdAt: string;
  read: boolean;
};

/** `tournamentId`: jen oznámení k jednomu turnaji (přehled turnaje v portálu organizátora). */
export async function getNotifications(
  userId: string,
  {
    limit = 20,
    unreadOnly = false,
    tournamentId,
  }: { limit?: number; unreadOnly?: boolean; tournamentId?: string } = {}
): Promise<AppNotification[]> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("id, kind, tournament_id, team_id, note, created_at, read_at, tournament:tournaments(name), team:teams(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (unreadOnly) query = query.is("read_at", null);
  if (tournamentId) query = query.eq("tournament_id", tournamentId);

  const { data, error } = await query;
  if (missingTable(error)) return [];
  if (error) {
    console.error("[oznámení] nenačetla se", error.code, error.message);
    return [];
  }

  return data.map((n) => ({
    id: n.id,
    kind: n.kind,
    tournamentId: n.tournament_id,
    tournamentName: n.tournament?.name ?? "",
    teamId: n.team_id,
    teamName: n.team?.name ?? "",
    note: n.note,
    createdAt: n.created_at,
    read: n.read_at !== null,
  }));
}

/** Počet nepřečtených oznámení (odznak v navigaci). */
export async function countUnreadNotifications(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) {
    if (!missingTable(error)) console.error("[oznámení] počet se nenačetl", error.code, error.message);
    return 0;
  }
  return count ?? 0;
}

/** Nepřečtená oznámení po turnajích (karty turnajů v přehledu organizátora). */
export async function countUnreadByTournament(userId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("tournament_id")
    .eq("user_id", userId)
    .is("read_at", null);
  const counts = new Map<string, number>();
  if (error) {
    if (!missingTable(error)) console.error("[oznámení] počty po turnajích se nenačetly", error.code, error.message);
    return counts;
  }
  for (const n of data) if (n.tournament_id) counts.set(n.tournament_id, (counts.get(n.tournament_id) ?? 0) + 1);
  return counts;
}

/**
 * Označí oznámení jako přečtená — konkrétní (ids), všechna k jednomu turnaji
 * (tournamentId), nebo všechna nepřečtená.
 */
export async function markNotificationsRead(userId: string, ids?: string[], tournamentId?: string): Promise<void> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (ids?.length) query = query.in("id", ids);
  if (tournamentId) query = query.eq("tournament_id", tournamentId);
  const { error } = await query;
  if (error && !missingTable(error)) console.error("[oznámení] neoznačila se", error.code, error.message);
}
