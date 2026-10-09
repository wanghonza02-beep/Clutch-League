// Cesty mezi přihlášením, účtem a přihláškou týmu. Čisté funkce bez
// serverových importů, takže je používají serverové stránky i klientské formuláře.

export const PATHS = {
  login: "/prihlaseni",
  signup: "/registrace",
  forgotPassword: "/zapomenute-heslo",
  newPassword: "/nove-heslo",
  teamRegistration: "/prihlasit-tym",
  portal: "/portal",
} as const;

/**
 * Pustí dál jen interní cestu z parametru ?next=. Cokoli jiného (cizí doména,
 * "//evil.cz", pole hodnot) nahradí výchozí cestou — brání open redirectu.
 */
export function safeNext(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export function withNext(path: string, next?: string): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
