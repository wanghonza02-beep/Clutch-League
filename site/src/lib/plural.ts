/**
 * Český tvar podle počtu: plural(3, ["hráč", "hráči", "hráčů"]) → "hráči".
 * Pořadí tvarů: 1 / 2–4 / ostatní (včetně 0).
 */
export function plural(count: number, [one, few, many]: [string, string, string]): string {
  if (count === 1) return one;
  if (count >= 2 && count <= 4) return few;
  return many;
}

/** "3 hráči" — 1. pád, např. "Na soupisce jsou 3 hráči". */
export const PLAYERS_NOM: [string, string, string] = ["hráč", "hráči", "hráčů"];

/** "3 hráče" — 4. pád, např. "Potřebuješ aspoň 3 hráče". */
export const PLAYERS_ACC: [string, string, string] = ["hráče", "hráče", "hráčů"];
