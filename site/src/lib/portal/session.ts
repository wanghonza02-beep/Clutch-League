import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { PATHS } from "./paths";
import type { Role, SessionUser } from "./types";

/**
 * Přihlášený uživatel, nebo null. Identitu ověřuje getClaims() — podpis
 * tokenu z cookies; getSession() by na serveru věřil čemukoli v cookie.
 * Profil (jméno, telefon, role) je v tabulce profiles.
 * cache(): v jednom vykreslení stránky se dotaz pošle jen jednou.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Stránka s přihlášením se musí renderovat až na požadavek. Bez tohohle by
  // ji build bez vyplněných klíčů Supabase předvyrenderoval jako statickou
  // (cookies by se vůbec nečetly) a portál by pak nefungoval.
  await connection();
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: claims.sub,
    email: claims.email ?? "",
    name: profile.full_name,
    phone: profile.phone,
    role: profile.role,
  };
});

/**
 * Stráž pro chráněné stránky a server akce. Bez přihlášení přesměruje na
 * přihlášení. Volá se v každé chráněné části zvlášť — ne jen v layoutu.
 * Skutečnou ochranu dat drží RLS v databázi; tohle je hlavně UX.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(PATHS.login);
  return user;
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) redirect(PATHS.portal);
  return user;
}
