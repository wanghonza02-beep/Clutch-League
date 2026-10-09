import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Klient za přihlášeného uživatele (session z cookies) — pro server
 * komponenty, server akce a route handlery. Na každý požadavek nový,
 * nikdy ho nedávej do globální proměnné.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Volané ze server komponenty, kde cookies zapsat nejde. Nevadí —
          // obnovenou session zapíše proxy (src/proxy.ts) u dalšího požadavku.
        }
      },
    },
  });
}
