import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/**
 * Obnoví přihlášení (access token platí hodinu) a zapíše nové cookies do
 * požadavku i odpovědi. Bez toho by Supabase uživatele po čase odhlásil.
 * Postup je převzatý z oficiální šablony Supabase — mezi createServerClient
 * a getClaims() nesmí běžet žádný jiný kód.
 *
 * `respond` vyrobí odpověď (NextResponse.next nebo rewrite na jazyk) — po
 * zápisu cookies se vyrobí znovu, aby nesla aktualizovaný požadavek.
 */
export async function updateSession(request: NextRequest, respond: () => NextResponse) {
  let response = respond();
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = respond();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}
