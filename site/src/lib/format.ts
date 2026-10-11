import { DEFAULT_LOCALE, INTL_LOCALE, type Locale } from "@/i18n/config";

/**
 * Telefon pro zobrazení: "+420603111222" → "+420 603 111 222".
 * Ukládá se bez mezer (kvůli porovnávání), tohle je jen pro oči.
 * Tvary, které nezná (zahraniční čísla), vrací beze změny.
 */
export function formatPhone(phone: string): string {
  const match = phone.match(/^(\+\d{3})?(\d{3})(\d{3})(\d{3})$/);
  if (!match) return phone;
  return match.slice(1).filter(Boolean).join(" ");
}

const ZONE = "Europe/Prague";

const englishDate = new Intl.DateTimeFormat(INTL_LOCALE.en, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Datum bez času ("2026-06-21") podle jazyka: "21. 6. 2026" (cs, sk),
 * "21.06.2026" (uk), "21 Jun 2026" (en). Bez časové zóny, ať se neposune den.
 */
export function formatDate(isoDate: string, locale: Locale = DEFAULT_LOCALE): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  if (locale === "en") return englishDate.format(new Date(Date.UTC(year, month - 1, day)));
  if (locale === "uk") return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
  return `${day}. ${month}. ${year}`;
}

const timeFormat = new Intl.DateTimeFormat("cs-CZ", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: ZONE,
});

/** Čas výkopu v pražském čase → "09:00" (24hodinový ve všech jazycích). */
export function formatTime(timestamp: string): string {
  return timeFormat.format(new Date(timestamp));
}

const isoDayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE });

/** Den v pražském čase ("2027-01-10") pro okamžik v ISO. */
export function pragueIsoDay(timestamp: string): string {
  return isoDayFormat.format(new Date(timestamp));
}

/** Datum a čas v pražském čase → "10. 1. 2027 10:00" podle jazyka. */
export function formatDateTime(timestamp: string, locale: Locale = DEFAULT_LOCALE): string {
  return `${formatDate(pragueIsoDay(timestamp), locale)} ${formatTime(timestamp)}`;
}

/** Začátek dne ("2027-01-10") v pražském čase jako okamžik v ISO (UTC). */
export function pragueDayStart(isoDate: string): string {
  const utcMidnight = new Date(`${isoDate}T00:00:00Z`);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, timeZoneName: "longOffset" })
    .formatToParts(utcMidnight)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = offset?.match(/GMT([+-])(\d{2}):(\d{2})/);
  const minutes = match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
  return new Date(utcMidnight.getTime() - minutes * 60_000).toISOString();
}
