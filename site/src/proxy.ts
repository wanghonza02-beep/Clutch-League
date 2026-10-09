import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Jen stránky, které pracují s přihlášením. Úvodní stránka, archiv turnajů
// a další veřejné stránky se tak obejdou bez dotazu na Supabase a zůstávají
// statické. Navigace si přihlášení ověřuje přes /api/session, takže session
// se obnovuje i při procházení veřejných stránek.
export const config = {
  matcher: [
    "/portal/:path*",
    "/prihlaseni",
    "/registrace",
    "/prihlasit-tym",
    "/zapomenute-heslo",
    "/nove-heslo",
    "/auth/:path*",
    "/api/session",
  ],
};
