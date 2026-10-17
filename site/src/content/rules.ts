// Dokumenty na stránce /pravidla (src/app/[lang]/pravidla/page.tsx).
//
// Stránka má dvě sekce:
//   Obecná pravidla  = PDF v public/docs,
//   Aktivní pravidla = karty módů (obrázky PNG, česky) z Disku, složka
//                      „Cluth League“ → „AKTIVNI PRAVIDLA“, uložené beze změny
//                      v public/docs/pravidla.
// Prázdný seznam = stránka ukáže „Zatím tu nic není“.
// Popisky (nadpisy, popis karty) jsou ve slovnících jazyků, část rules.

export type RuleCard = {
  /** Číslo na kartě (01–06). */
  number: string;
  /** Název módu, jak je na kartě. Ve všech jazycích stejný. */
  name: string;
  /** Jak dlouho mód platí, podle karty. */
  minutes: number;
  /** Soubor ve složce public a jeho rozměry v px. */
  href: string;
  width: number;
  height: number;
};

export const GENERAL_RULES_PDF = "/docs/pravidla-clutch-league-cup-2026.pdf";

// Karty z „AKTIVNI PRAVIDLA“ jsou na výšku.
const PORTRAIT = [1122, 1402] as const;

const card = (
  number: string,
  name: string,
  minutes: number,
  file: string,
  [width, height]: readonly [number, number]
): RuleCard => ({ number, name, minutes, href: `/docs/pravidla/${file}`, width, height });

export const ACTIVE_RULES: RuleCard[] = [
  card("01", "Mini Ball", 10, "mini-ball-10min.png", PORTRAIT),
  card("02", "No Hands", 10, "no-hands-10min.png", PORTRAIT),
  card("03", "3 vs 3", 10, "3vs3-10min.png", PORTRAIT),
  card("04", "+1", 10, "plus-1-10min.png", PORTRAIT),
  card("05", "Air Strike", 10, "air-strike-10min.png", PORTRAIT),
  card("06", "Clutch Player", 10, "clutch-player-10min.png", PORTRAIT),
];
