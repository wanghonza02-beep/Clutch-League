// Winter Clutch League — náhled: kdo s kým hraje, kdy a soupisky týmů.
// Stránky: /winter-clutch (rozpis + týmy) a /winter-clutch/[tym] (soupiska).
//
// ⚠️ ZÁSTUPNÁ (UKÁZKOVÁ) DATA. Týmy, hráči i časy jsou vymyšlené jen proto,
// aby stránka měla co ukázat. Dokud je `placeholder: true`, web nad rozpisem
// i u každé soupisky ukazuje výrazné upozornění „Ukázková data“.
//
// Jak doplnit skutečná data (stačí upravit jen tenhle soubor):
//   1. V `teams` přepiš názvy týmů, skupiny a soupisky. `slug` je kousek
//      adresy (/winter-clutch/<slug>) — malá písmena bez diakritiky a mezer.
//   2. Soupisku napiš místo `placeholderRoster()` jako seznam, např.:
//        players: [
//          { number: 1, name: "Jan Novák", position: "goalkeeper" },
//          { number: 7, name: "Petr Svoboda", position: "forward", captain: true },
//        ],
//      Pozice: goalkeeper (brankář), defender, midfielder, forward.
//   3. V `matches` uprav kola, časy a dvojice (home/away = slug týmu).
//   4. Nakonec nastav `placeholder: false`.

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

/** ⚠️ Zástupná soupiska — stejná pro všechny týmy, dokud nebudou skutečné. */
function placeholderRoster(): PreviewPlayer[] {
  return [
    { number: 1, name: "Hráč 1", position: "goalkeeper" },
    { number: 2, name: "Hráč 2", position: "defender", captain: true },
    { number: 3, name: "Hráč 3", position: "midfielder" },
    { number: 4, name: "Hráč 4", position: "forward" },
    { number: 5, name: "Hráč 5", position: "forward" },
  ];
}

export const WINTER_PREVIEW: WinterPreview = {
  placeholder: true,
  name: "Winter Clutch League",
  venue: "",

  teams: [
    { slug: "tym-a1", name: "Tým A1", group: "A", players: placeholderRoster() },
    { slug: "tym-a2", name: "Tým A2", group: "A", players: placeholderRoster() },
    { slug: "tym-a3", name: "Tým A3", group: "A", players: placeholderRoster() },
    { slug: "tym-a4", name: "Tým A4", group: "A", players: placeholderRoster() },
    { slug: "tym-b1", name: "Tým B1", group: "B", players: placeholderRoster() },
    { slug: "tym-b2", name: "Tým B2", group: "B", players: placeholderRoster() },
    { slug: "tym-b3", name: "Tým B3", group: "B", players: placeholderRoster() },
    { slug: "tym-b4", name: "Tým B4", group: "B", players: placeholderRoster() },
  ],

  // Každý s každým ve skupině: 3 kola po 2 zápasech v každé skupině.
  matches: [
    { round: "1. kolo", group: "A", date: "2027-01-10", time: "10:00", home: "tym-a1", away: "tym-a2" },
    { round: "1. kolo", group: "A", date: "2027-01-10", time: "10:20", home: "tym-a3", away: "tym-a4" },
    { round: "1. kolo", group: "B", date: "2027-01-10", time: "10:40", home: "tym-b1", away: "tym-b2" },
    { round: "1. kolo", group: "B", date: "2027-01-10", time: "11:00", home: "tym-b3", away: "tym-b4" },

    { round: "2. kolo", group: "A", date: "2027-01-10", time: "11:20", home: "tym-a1", away: "tym-a3" },
    { round: "2. kolo", group: "A", date: "2027-01-10", time: "11:40", home: "tym-a2", away: "tym-a4" },
    { round: "2. kolo", group: "B", date: "2027-01-10", time: "12:00", home: "tym-b1", away: "tym-b3" },
    { round: "2. kolo", group: "B", date: "2027-01-10", time: "12:20", home: "tym-b2", away: "tym-b4" },

    { round: "3. kolo", group: "A", date: "2027-01-10", time: "12:40", home: "tym-a1", away: "tym-a4" },
    { round: "3. kolo", group: "A", date: "2027-01-10", time: "13:00", home: "tym-a2", away: "tym-a3" },
    { round: "3. kolo", group: "B", date: "2027-01-10", time: "13:20", home: "tym-b1", away: "tym-b4" },
    { round: "3. kolo", group: "B", date: "2027-01-10", time: "13:40", home: "tym-b2", away: "tym-b3" },
  ],
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
