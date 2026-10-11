import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { updateSession } from "@/lib/supabase/proxy";

// Jazyky: stránky žijí v app/[lang]. Čeština má adresy bez předpony
// (/turnaje) — proxy je interně přepíše na /cs/turnaje. Ostatní jazyky mají
// předponu v adrese (/en/turnaje) a projdou beze změny.
//
// Přihlášení: session se obnovuje jen na stránkách, které s ním pracují.
// Úvodní stránka, archiv turnajů a další veřejné stránky se tak obejdou bez
// dotazu na Supabase a zůstávají statické. Navigace si přihlášení ověřuje
// přes /api/session, takže session se obnovuje i při procházení webu.

const SESSION_PATHS = [
  "/portal",
  "/prihlaseni",
  "/registrace",
  "/prihlasit-tym",
  "/zapomenute-heslo",
  "/nove-heslo",
  "/auth",
  "/api/session",
];

function needsSession(path: string): boolean {
  return SESSION_PATHS.some((base) => path === base || path.startsWith(`${base}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return updateSession(request, () => NextResponse.next({ request }));
  }

  const first = pathname.split("/")[1];

  // /cs/… → kanonická adresa bez předpony.
  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  // /en/…, /uk/…, /sk/… — stránka existuje přímo pod app/[lang].
  if (isLocale(first)) {
    const path = pathname.slice(first.length + 1) || "/";
    const next = () => NextResponse.next({ request });
    return needsSession(path) ? updateSession(request, next) : next();
  }

  // Čeština. Kdo si přepínačem vybral jiný jazyk, pokračuje v něm.
  const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
  if (request.method === "GET" && isLocale(preferred) && preferred !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  const rewrite = () => NextResponse.rewrite(url, { request });
  return needsSession(pathname) ? updateSession(request, rewrite) : rewrite();
}

export const config = {
  matcher: [
    // Všechno kromě souborů Nextu, souborů z public (mají v názvu tečku)
    // a /auth/confirm — odkaz z e-mailu, route handler mimo jazyky.
    "/((?!_next/|auth/confirm|.*\\..*).*)",
  ],
};
