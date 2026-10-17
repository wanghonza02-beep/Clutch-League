// Dokumenty na stránce /pravidla (src/app/[lang]/pravidla/page.tsx).
//
// Obecná pravidla jsou PDF v public/docs. Ostatní sekce jsou karty módů
// (obrázky PNG, česky) z Disku, složka „Cluth League“, uložené beze změny
// v public/docs/pravidla:
//   Speciální pravidla = složka „Pravidla #2“ (bez obrázku medailí a pohárů,
//                        nejsou to pravidla),
//   Aktivní pravidla   = složka „AKTIVNI PRAVIDLA“,
//   Neaktivní pravidla = složka „NEAKTIVNÍ PRAVIDLA“ (na Disku jsou to přesné
//                        kopie dvou karet z „Pravidla #2“, proto stejné soubory).
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

// Karty z „Pravidla #2“ jsou čtvercové, karty z „AKTIVNI PRAVIDLA“ na výšku.
const SQUARE = [1254, 1254] as const;
const PORTRAIT = [1122, 1402] as const;

const card = (
  number: string,
  name: string,
  minutes: number,
  file: string,
  [width, height]: readonly [number, number]
): RuleCard => ({ number, name, minutes, href: `/docs/pravidla/${file}`, width, height });

const TURBO_MODE = card("01", "Turbo Mode", 3, "turbo-mode-3min.png", SQUARE);
const NO_CONTACT = card("04", "No Contact", 3, "no-contact-3min.png", SQUARE);

export const SPECIAL_RULES: RuleCard[] = [
  TURBO_MODE,
  card("02", "No Hands", 3, "no-hands-3min.png", SQUARE),
  card("03", "Clutch Player", 3, "clutch-player-3min.png", SQUARE),
  NO_CONTACT,
  card("05", "Air Strike", 3, "air-strike-3min.png", SQUARE),
  card("06", "3 vs 3", 3, "3vs3-3min.png", SQUARE),
];

export const ACTIVE_RULES: RuleCard[] = [
  card("01", "Mini Ball", 10, "mini-ball-10min.png", PORTRAIT),
  card("02", "No Hands", 10, "no-hands-10min.png", PORTRAIT),
  card("03", "3 vs 3", 10, "3vs3-10min.png", PORTRAIT),
  card("04", "+1", 10, "plus-1-10min.png", PORTRAIT),
  card("05", "Air Strike", 10, "air-strike-10min.png", PORTRAIT),
  card("06", "Clutch Player", 10, "clutch-player-10min.png", PORTRAIT),
];

export const INACTIVE_RULES: RuleCard[] = [TURBO_MODE, NO_CONTACT];
