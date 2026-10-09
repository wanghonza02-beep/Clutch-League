import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUpcomingTournament } from "@/lib/tournaments";

/** Karta „Další na řadě“ na úvodní stránce (Historie i Fotky). */
export type UpcomingCard = {
  name: string;
  dateLabel: string;
  summary: string;
  registrationOpen: boolean;
};

// Záloha, když databáze není připojená nebo neodpoví — úvodní stránka tak
// nikdy nezůstane bez karty dalšího turnaje.
const FALLBACK_UPCOMING: UpcomingCard = {
  name: "Winter Clutch",
  dateLabel: "10. 1. 2027",
  summary:
    "Zimní turnaj 3 na 3 na menším hřišti, mimo ligovou tabulku. Stejná parta, jiné hřiště.",
  registrationOpen: true,
};

const NO_UPCOMING: UpcomingCard = {
  name: "Další turnaj",
  dateLabel: "Termín oznámíme",
  summary: "Další turnaj právě chystáme. Sleduj nás na Instagramu, ať ti neuteče.",
  registrationOpen: false,
};

/** cache(): sekce Historie i Fotky si turnaj načtou jen jednou na vykreslení. */
export const loadUpcoming = cache(async (): Promise<UpcomingCard> => {
  if (!isSupabaseConfigured()) return FALLBACK_UPCOMING;
  try {
    const t = await getUpcomingTournament();
    if (!t) return NO_UPCOMING;
    return {
      name: t.name,
      dateLabel: t.dateLabel,
      summary: t.summary || FALLBACK_UPCOMING.summary,
      registrationOpen: t.registrationOpen,
    };
  } catch (error) {
    console.error("[úvod] nadcházející turnaj se nenačetl", error);
    return FALLBACK_UPCOMING;
  }
});
