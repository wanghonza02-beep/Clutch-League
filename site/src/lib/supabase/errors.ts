import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Chybí tabulka — web je novější než databáze (migrace v Supabase ještě
 * neproběhla). Stránky pak data z ní prostě neukazují, místo aby spadly.
 */
export function missingTable(error: Pick<PostgrestError, "code"> | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}
