import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { PATHS, safeNext } from "@/lib/portal/paths";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Sem vedou odkazy z e-mailů: potvrzení účtu i nové heslo. Po ověření je
 * uživatel přihlášený a pokračuje na `next` (přihláška týmu / nové heslo).
 *
 * Dvě varianty odkazu:
 *  - token_hash + type — z našich šablon (supabase/templates). Funguje
 *    i když e-mail otevře na jiném zařízení.
 *  - code — z výchozích šablon Supabase (PKCE). Funguje jen ve stejném
 *    prohlížeči, ve kterém se o e-mail požádalo.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"), PATHS.portal);

  // Supabase sem při neplatném odkazu posílá chybu v parametrech.
  const errorCode = params.get("error_code") ?? params.get("error");
  if (errorCode) redirect(`/auth/chyba?duvod=${encodeURIComponent(errorCode)}`);
  if (!isSupabaseConfigured()) redirect("/auth/chyba?duvod=not_configured");

  const supabase = await createClient();
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
    redirect(`/auth/chyba?duvod=${encodeURIComponent(error.code ?? "verify_failed")}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
    redirect(`/auth/chyba?duvod=${encodeURIComponent(error.code ?? "exchange_failed")}`);
  }

  redirect("/auth/chyba");
}
