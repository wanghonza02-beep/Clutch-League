import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { localePath, splitLocale } from "@/i18n/config";
import { PATHS, safeNext } from "@/lib/portal/paths";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Sem vedou odkazy z e-mailů: potvrzení účtu i nové heslo. Po ověření je
 * uživatel přihlášený a pokračuje na `next` (přihláška týmu / nové heslo)
 * v jazyce, ve kterém o e-mail požádal (next = /en/prihlasit-tym).
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
  // Chybová stránka v jazyce, ze kterého odkaz přišel.
  const errorPage = (reason?: string) =>
    `${localePath(splitLocale(next).locale, "/auth/chyba")}${reason ? `?duvod=${encodeURIComponent(reason)}` : ""}`;

  // Supabase sem při neplatném odkazu posílá chybu v parametrech.
  const errorCode = params.get("error_code") ?? params.get("error");
  if (errorCode) redirect(errorPage(errorCode));
  if (!isSupabaseConfigured()) redirect(errorPage("not_configured"));

  const supabase = await createClient();
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
    redirect(errorPage(error.code ?? "verify_failed"));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
    redirect(errorPage(error.code ?? "exchange_failed"));
  }

  redirect(errorPage());
}
