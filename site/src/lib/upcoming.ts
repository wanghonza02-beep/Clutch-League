import { cache } from "react";
import { pragueDayStart, pragueIsoDay } from "@/lib/format";
import { getActiveTournaments, getTournamentSchedule, type ActiveTournament, type ScheduledMatch } from "@/lib/tournaments";
import { startInstant } from "@/lib/tournamentModel";

// Turnaje pro úvodní stránku — všechny z Rozpisu turnajů v administraci, jen
// ty zobrazené na webu. Nahoře kampaň s nejbližším turnajem (odpočet, rozpis
// zápasů), pod ní ostatní neodehrané turnaje. Odehrané jsou v sekci
// Odehrané zápasy (lib/tournaments.ts → getTournaments).

/** Turnaj v kampani nahoře: nejbližší neodehraný, probíhající má přednost. */
export type FeaturedTournament = ActiveTournament & {
  /** Výkop prvního zápasu v den turnaje (ISO), nebo null, dokud ten den žádný zápas není. */
  firstKickoff: string | null;
  /** Kam běží odpočet: zadaný čas začátku, jinak první výkop v den turnaje, jinak začátek dne (Praha). */
  startsAt: string;
  /** Konec dne turnaje (Praha) — do té doby web píše „Hrajeme dnes!“. */
  endsAt: string;
  /** Rozpis zápasů podle výkopu. Prázdný, dokud ho organizátor nezadá. */
  schedule: ScheduledMatch[];
};

export type LandingTournaments = {
  /** Null = žádný neodehraný turnaj na webu není (úvod ukáže čistý prázdný stav). */
  featured: FeaturedTournament | null;
  /** Další neodehrané turnaje, bez toho z kampaně — každý turnaj je na stránce jen jednou. */
  others: ActiveTournament[];
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
function featured(tournament: ActiveTournament, allMatches: ScheduledMatch[]): FeaturedTournament {
  const schedule = allMatches.filter((m) => pragueIsoDay(m.kickoff) >= tournament.dateIso);
  const firstKickoff = schedule.find((m) => pragueIsoDay(m.kickoff) === tournament.dateIso)?.kickoff ?? null;
  return {
    ...tournament,
    firstKickoff,
    startsAt:
      startInstant(tournament.dateIso, tournament.startTime) ?? firstKickoff ?? pragueDayStart(tournament.dateIso),
    endsAt: pragueDayStart(nextDay(tournament.dateIso)),
    schedule,
  };
}

const NONE: LandingTournaments = { featured: null, others: [] };

/**
 * Turnaje pro úvodní stránku. Bez databáze nebo při chybě čistý prázdný stav —
 * nikdy vymyšlený turnaj. cache(): kampaň i seznam turnajů čtou jen jednou.
 */
export const loadLandingTournaments = cache(async (): Promise<LandingTournaments> => {
  try {
    const [first, ...others] = await getActiveTournaments();
    if (!first) return NONE;
    return { featured: featured(first, await getTournamentSchedule(first.id)), others };
  } catch (error) {
    console.error("[úvod] turnaje se nenačetly", error);
    return NONE;
  }
});
