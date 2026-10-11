import { cache } from "react";
import { pragueDayStart, pragueIsoDay } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUpcomingTournament, type ScheduledMatch } from "@/lib/tournaments";

/** Nadcházející turnaj pro úvodní stránku (kampaň nahoře a dlaždice ve Fotkách). */
export type UpcomingCard = {
  name: string;
  /** Datum "RRRR-MM-DD" — formátuje se podle jazyka stránky. */
  dateIso: string;
  /** Výkop prvního zápasu v den turnaje (ISO), nebo null, dokud ten den žádný zápas není. */
  firstKickoff: string | null;
  /** Kam běží odpočet: první výkop v den turnaje, jinak začátek dne turnaje (Praha). */
  startsAt: string;
  /** Konec dne turnaje (Praha) — do té doby web píše „Hrajeme dnes!“. */
  endsAt: string;
  /** Rozpis zápasů podle výkopu. Prázdný, dokud ho organizátor nezadá. */
  schedule: ScheduledMatch[];
};

/** Následující den ("2027-01-10" → "2027-01-11"). */
function nextDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

// Datum turnaje je to, co organizátor zadal u turnaje. Čas výkopu se bere jen ze
// zápasů v ten den — zápas zapsaný omylem s jiným datem tak nepřepíše odpočet.
// Zápas s výkopem před dnem turnaje je chyba v datech: web ho neukáže, administrace
// u něj píše upozornění (a nový takový uložit nejde).
function card(name: string, dateIso: string, allMatches: ScheduledMatch[]): UpcomingCard {
  const schedule = allMatches.filter((m) => pragueIsoDay(m.kickoff) >= dateIso);
  const firstKickoff = schedule.find((m) => pragueIsoDay(m.kickoff) === dateIso)?.kickoff ?? null;
  return {
    name,
    dateIso,
    firstKickoff,
    startsAt: firstKickoff ?? pragueDayStart(dateIso),
    endsAt: pragueDayStart(nextDay(dateIso)),
    schedule,
  };
}

// Záloha, když databáze není připojená nebo neodpoví — úvodní stránka tak
// nikdy nezůstane bez dalšího turnaje.
const FALLBACK_UPCOMING = card("Winter Clutch", "2027-01-10", []);

/** Nadcházející turnaj, nebo null, když žádný naplánovaný není. */
export const loadUpcoming = cache(async (): Promise<UpcomingCard | null> => {
  if (!isSupabaseConfigured()) return FALLBACK_UPCOMING;
  try {
    const t = await getUpcomingTournament();
    return t ? card(t.name, t.dateIso, t.schedule) : null;
  } catch (error) {
    console.error("[úvod] nadcházející turnaj se nenačetl", error);
    return FALLBACK_UPCOMING;
  }
});
