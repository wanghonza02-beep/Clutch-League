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

/** Datum bez času ("2026-06-21") → "21. 6. 2026". Bez časové zóny, ať se neposune den. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return `${day}. ${month}. ${year}`;
}

const timeFormat = new Intl.DateTimeFormat("cs-CZ", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: ZONE,
});

/** Čas výkopu v pražském čase → "09:00". */
export function formatTime(timestamp: string): string {
  return timeFormat.format(new Date(timestamp));
}

const dateTimeFormat = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: ZONE,
});

/** Datum a čas v pražském čase → "10. 1. 2027 10:00". */
export function formatDateTime(timestamp: string): string {
  return dateTimeFormat.format(new Date(timestamp));
}
