// Zápis výsledku zápasu — typy, popisky a kontroly. Čisté funkce bez
// serverových importů: používá je server (akce) i formulář v prohlížeči.
// Stejné kontroly hlídá i databáze (admin_save_match_result), tohle je
// hlavně kvůli srozumitelným hláškám u konkrétního pole.

import type { MatchEventKind } from "@/lib/supabase/database.types";

export const EVENT_KINDS: MatchEventKind[] = ["goal", "yellow_card", "red_card"];

export const EVENT_LABEL: Record<MatchEventKind, string> = {
  goal: "Gól",
  yellow_card: "Žlutá karta",
  red_card: "Červená karta",
};

export type Side = "home" | "away";

/** Řádek formuláře tak, jak ho posílá prohlížeč (vše jako text). */
export type EventInput = {
  kind: string;
  side: string;
  firstName: string;
  lastName: string;
  minute: string;
};

export type ValidEvent = {
  kind: MatchEventKind;
  side: Side;
  firstName: string;
  lastName: string;
  minute: number;
};

export type ResultValidation = {
  errors: Record<string, string>;
  message?: string;
  homeGoals: number | null;
  awayGoals: number | null;
  events: ValidEvent[];
};

/**
 * Nejvyšší rozumná minuta: délka zápasu z turnaje („15 min“) + 10 minut
 * rezervy na nastavení. Když délka zadaná není, 90 minut.
 */
export function maxMinute(matchLength: string): number {
  const length = Number.parseInt(matchLength, 10);
  return Number.isFinite(length) && length > 0 ? Math.min(length + 10, 120) : 90;
}

/** Body za zápas — automaticky ze skóre: výhra 3, remíza 1, prohra 0. */
export function matchPoints(homeGoals: number, awayGoals: number): [number, number] {
  if (homeGoals > awayGoals) return [3, 0];
  if (homeGoals < awayGoals) return [0, 3];
  return [1, 1];
}

function parseGoals(raw: string): number | null | undefined {
  const value = raw.trim();
  if (value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 99 ? n : undefined;
}

export function validateResult(
  input: { homeGoals: string; awayGoals: string; events: EventInput[] },
  limit: number
): ResultValidation {
  const errors: Record<string, string> = {};
  const homeGoals = parseGoals(input.homeGoals);
  const awayGoals = parseGoals(input.awayGoals);

  if (homeGoals === undefined) errors.homeGoals = "Zadej 0 až 99.";
  if (awayGoals === undefined) errors.awayGoals = "Zadej 0 až 99.";
  if (homeGoals !== undefined && awayGoals !== undefined && (homeGoals === null) !== (awayGoals === null)) {
    errors[homeGoals === null ? "homeGoals" : "awayGoals"] = "Doplň skóre obou týmů.";
  }

  const events: ValidEvent[] = [];
  input.events.forEach((row, i) => {
    const key = (field: string) => `event.${i}.${field}`;
    const kind = row.kind as MatchEventKind;
    const side = row.side as Side;
    if (!EVENT_KINDS.includes(kind)) errors[key("kind")] = "Vyber typ.";
    if (side !== "home" && side !== "away") errors[key("side")] = "Vyber tým.";

    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();
    if (!firstName) errors[key("firstName")] = "Chybí jméno.";
    else if (firstName.length > 60) errors[key("firstName")] = "Nejvýš 60 znaků.";
    if (!lastName) errors[key("lastName")] = "Chybí příjmení.";
    else if (lastName.length > 60) errors[key("lastName")] = "Nejvýš 60 znaků.";

    const minute = Number(row.minute.trim());
    if (row.minute.trim() === "" || !Number.isInteger(minute) || minute < 1 || minute > limit) {
      errors[key("minute")] = `1 až ${limit}.`;
    }

    events.push({ kind, side, firstName, lastName, minute });
  });

  const hasErrors = Object.keys(errors).length > 0;
  const scoreHome = homeGoals ?? null;
  const scoreAway = awayGoals ?? null;

  if (!hasErrors && scoreHome === null && events.length > 0) {
    return {
      errors: { homeGoals: "Nejdřív zadej skóre." },
      message: "Bez skóre nejde zapsat góly ani karty.",
      homeGoals: null,
      awayGoals: null,
      events,
    };
  }

  // Góly nemusí být rozepsané vůbec (zná se jen skóre); když ale jsou, musí
  // sedět se skóre přesně.
  if (!hasErrors && scoreHome !== null && scoreAway !== null) {
    const goals = events.filter((e) => e.kind === "goal");
    if (goals.length > 0) {
      const home = goals.filter((e) => e.side === "home").length;
      const away = goals.filter((e) => e.side === "away").length;
      if (home !== scoreHome || away !== scoreAway) {
        return {
          errors: { goals: "mismatch" },
          message: `Góly nesedí se skóre ${scoreHome}:${scoreAway} — zapsané góly dávají ${home}:${away}.`,
          homeGoals: scoreHome,
          awayGoals: scoreAway,
          events,
        };
      }
    }
  }

  return {
    errors,
    message: hasErrors ? "Zkontroluj zvýrazněná pole." : undefined,
    homeGoals: scoreHome,
    awayGoals: scoreAway,
    events,
  };
}
