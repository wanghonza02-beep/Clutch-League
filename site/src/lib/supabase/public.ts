import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Klient bez přihlášení (role anon) pro veřejná data: archiv turnajů,
 * názvy schválených týmů. Nečte cookies, takže stránky, které ho používají,
 * zůstávají statické a cachují se (ISR).
 */
export function createPublicClient() {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
