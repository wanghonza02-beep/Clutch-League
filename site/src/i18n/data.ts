import { DEFAULT_LOCALE, type Locale } from "./config";
import type { Dictionary } from "./dictionaries";
import { fmt } from "./format";

// Údaje, které organizátor píše do databáze česky a mají pevný tvar (fáze
// zápasu, sezóna, formát), se do ostatních jazyků přeloží. Volný český text
// (popis turnaje, popisek fotky) se ukazuje jen v češtině — viz czechOnly().
// Místo a názvy týmů jsou vlastní jména a zůstávají, jak je organizátor napsal.

const STAGES: [RegExp, keyof Omit<Dictionary["stages"], "group">][] = [
  [/^osmifin[aá]le/i, "round16"],
  [/^čtvrtfin[aá]le/i, "quarterfinal"],
  [/^semifin[aá]le/i, "semifinal"],
  [/^(zápas\s+)?o\s*3\.\s*míst[oa]/i, "thirdPlace"],
  [/^fin[aá]le/i, "final"],
];

/**
 * Volný text, který organizátor píše česky (popis turnaje). V ostatních
 * jazycích by stránka byla napůl česky — tam se nezobrazí (vrací "").
 */
export function czechOnly(text: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? text : "";
}

/** „Skupina A“ → „Group A“, „Semifinále 2“ → „Semi-final 2“. Neznámé nechá být. */
export function stageLabel(stage: string, t: Dictionary): string {
  const group = stage.match(/^skupina\s+(.+)$/i);
  if (group) return fmt(t.stages.group, { group: group[1] });
  for (const [re, key] of STAGES) {
    const match = stage.match(re);
    if (match) return `${t.stages[key]}${stage.slice(match[0].length)}`;
  }
  return stage;
}

const SEASONS: Record<string, keyof Dictionary["seasons"]> = {
  zima: "winter",
  jaro: "spring",
  léto: "summer",
  leto: "summer",
  podzim: "autumn",
};

/** „Zima 2027“ → „Winter 2027“. */
export function editionLabel(edition: string, t: Dictionary): string {
  const match = edition.match(/^(\S+)(\s+\d{4})$/);
  const season = match && SEASONS[match[1].toLocaleLowerCase("cs")];
  return season ? `${t.seasons[season]}${match[2]}` : edition;
}

/** Formát „3 na 3“ v jazyce stránky („3 v 3“, „3 на 3“). „5+1“ je všude stejně. */
export function formatLabel(format: string, locale: Locale): string {
  const match = format.match(/^(\d+)\s*na\s*(\d+)$/i);
  if (!match) return format;
  const word = { cs: "na", sk: "na", en: "v", uk: "на" }[locale];
  return `${match[1]} ${word} ${match[2]}`;
}
