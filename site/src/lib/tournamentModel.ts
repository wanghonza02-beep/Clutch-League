// Turnaj, jak s ním pracuje administrace (Rozpis turnajů a karty turnajů
// v ostatních sekcích portálu) i veřejný web (úvodní stránka, archiv).
// Čisté funkce bez serverových importů — běží na serveru i v prohlížeči.
//
// Stav turnaje má čtyři hodnoty. V databázi jsou to dva sloupce, protože
// otevřené přihlášky hlídají politiky a funkce přihlášek (registration_open):
//   připravuje se        status upcoming      registration_open false
//   otevřené přihlášky   status upcoming      registration_open true
//   probíhá              status in_progress   (migrace č. 10)
//   odehráno             status completed     — turnaj je v archivu na webu
// Stav (status) nastavuje organizátor v Rozpisu turnajů, přihlášky otevírá
// a zavírá přepínačem v přehledu turnaje — každé jen na jednom místě.

import type { Locale } from "@/i18n/config";
import { pragueLocalToIso } from "@/lib/admin/helpers";
import type { Database, TournamentStatus } from "@/lib/supabase/database.types";

type TournamentRow = Database["public"]["Tables"]["tournaments"]["Row"];

export type TournamentPhase = "preparing" | "registration" | "in_progress" | "completed";

/** Volby stavu ve formuláři turnaje (přihlášky jsou zvlášť). */
export const STATUSES: readonly TournamentStatus[] = ["upcoming", "in_progress", "completed"];

export function isStatus(value: unknown): value is TournamentStatus {
  return STATUSES.includes(value as TournamentStatus);
}

export function tournamentPhase(status: TournamentStatus, registrationOpen: boolean): TournamentPhase {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  return registrationOpen ? "registration" : "preparing";
}

/** Zlatý štítek pro to, co se právě děje (přihlášky, probíhá), šedý pro ostatní. */
export function phaseBadgeClass(phase: TournamentPhase): string {
  return phase === "registration" || phase === "in_progress" ? "cl-badge" : "cl-badge cl-badge--neutral";
}

const STATUS_ORDER: Record<TournamentStatus, number> = { in_progress: 0, upcoming: 1, completed: 2 };

/**
 * Pořadí turnajů ve všech seznamech: probíhající, pak nadcházející od
 * nejbližšího, odehrané nakonec od nejnovějšího.
 */
export function compareTournaments(
  a: { status: TournamentStatus; startsOn: string },
  b: { status: TournamentStatus; startsOn: string }
): number {
  return (
    STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
    (a.status === "completed" ? b.startsOn.localeCompare(a.startsOn) : a.startsOn.localeCompare(b.startsOn))
  );
}

/** Čas začátku z databáze ("10:00:00") → "10:00". Null = organizátor ho nezadal (i před migrací č. 10). */
export function startTimeOf(row: Pick<TournamentRow, "start_time">): string | null {
  return row.start_time ? row.start_time.slice(0, 5) : null;
}

/** Začátek turnaje jako okamžik (ISO) — jen když organizátor zadal čas. */
export function startInstant(dateIso: string, startTime: string | null): string | null {
  return startTime ? pragueLocalToIso(`${dateIso}T${startTime}`) : null;
}

/**
 * Popis turnaje po jazycích. Čeština je sloupec summary; prázdný popis se
 * v daném jazyce neukáže (český text se do jiných jazyků nepodsouvá).
 * `??`: před migrací č. 10 sloupce pro další jazyky chybí.
 */
export function tournamentSummaries(
  row: Pick<TournamentRow, "summary" | "summary_en" | "summary_uk" | "summary_sk">
): Record<Locale, string> {
  return {
    cs: row.summary ?? "",
    en: row.summary_en ?? "",
    uk: row.summary_uk ?? "",
    sk: row.summary_sk ?? "",
  };
}

/** Zobrazený na webu? Před migrací č. 10 sloupec chybí — tehdy byly vidět všechny. */
export function isPublished(row: Pick<TournamentRow, "published">): boolean {
  return row.published ?? true;
}
