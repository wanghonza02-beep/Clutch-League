// Winter Clutch League — náhled: kdo s kým hraje, kdy a soupisky týmů.
// Stránky: /winter-clutch (rozpis + týmy) a /winter-clutch/[tym] (soupiska).
//
// Zatím prázdné: rozpis a soupisky se zveřejní po uzávěrce přihlášek. Dokud
// je `teams` prázdné, stránka /winter-clutch to jen oznámí a odkazy na rozpis
// (sekce Pravidla, archiv turnajů) se neukazují.
//
// Jak doplnit skutečná data (stačí upravit jen tenhle soubor):
//   1. Do `teams` napiš týmy, skupiny a soupisky. `slug` je kousek
//      adresy (/winter-clutch/<slug>) — malá písmena bez diakritiky a mezer:
//        { slug: "zluty-balet", name: "Žlutý balet", group: "A", players: [
//          { number: 1, name: "Jan Novák", position: "goalkeeper" },
//          { number: 7, name: "Petr Svoboda", position: "forward", captain: true },
//        ] },
//      Pozice: goalkeeper (brankář), defender, midfielder, forward.
//      Jména hráčů jsou na veřejné stránce = osobní údaje, jen se souhlasem hráčů.
//   2. Do `matches` napiš kola, časy a dvojice (home/away = slug týmu).
//   3. `placeholder: true` nastav jen pro zkušební data — web je pak výrazně označí.

import type { Position } from "@/lib/portal/types";

export type PreviewPlayer = {
  number: number;
  name: string;
  position: Position;
  /** Kapitán týmu (jen jeden na tým). */
  captain?: boolean;
};

export type PreviewTeam = {
  slug: string;
  name: string;
  /** Skupina, ve které tým hraje („A“, „B“…). */
  group: string;
  players: PreviewPlayer[];
};

export type PreviewMatch = {
  /** „1. kolo“, „2. kolo“… */
  round: string;
  group: string;
  /** Datum ve tvaru RRRR-MM-DD. */
  date: string;
  /** Čas výkopu (pražský čas), např. „10:20“. */
  time: string;
  /** Slug domácího a hostujícího týmu z `teams`. */
  home: string;
  away: string;
};

export type WinterPreview = {
  /** true = ukázková data; stránky je výrazně označí. */
  placeholder: boolean;
  name: string;
  /** Místo konání, prázdné = zatím neznámé. */
  venue: string;
  teams: PreviewTeam[];
  matches: PreviewMatch[];
};

export const WINTER_PREVIEW: WinterPreview = {
  placeholder: false,
  name: "Winter Clutch League",
  venue: "",
  teams: [],
  matches: [],
};

/* -------------------------------------------------------------------------- */
/*  Pomocné funkce pro stránky                                                */
/* -------------------------------------------------------------------------- */

export function previewTeam(slug: string): PreviewTeam | undefined {
  return WINTER_PREVIEW.teams.find((t) => t.slug === slug);
}

/** Zápasy po kolech, v pořadí podle data a času. */
export function previewRounds(): { round: string; matches: PreviewMatch[] }[] {
  const sorted = [...WINTER_PREVIEW.matches].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
  );
  const rounds = new Map<string, PreviewMatch[]>();
  for (const m of sorted) rounds.set(m.round, [...(rounds.get(m.round) ?? []), m]);
  return [...rounds].map(([round, matches]) => ({ round, matches }));
}

/** Týmy po skupinách (A, B…). */
export function previewGroups(): { group: string; teams: PreviewTeam[] }[] {
  const groups = new Map<string, PreviewTeam[]>();
  for (const t of WINTER_PREVIEW.teams) groups.set(t.group, [...(groups.get(t.group) ?? []), t]);
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b, "cs"))
    .map(([group, teams]) => ({ group, teams }));
}

/** Hrací dny kampaně, seřazené (RRRR-MM-DD). */
export function previewDates(): string[] {
  return [...new Set(WINTER_PREVIEW.matches.map((m) => m.date))].sort();
}
