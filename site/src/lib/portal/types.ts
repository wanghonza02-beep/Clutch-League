// Datový model portálu tak, jak s ním pracuje UI. Databáze (Supabase) má
// vlastní tvar v snake_case — převod je v data.ts. Popisky (role, pozice,
// stav přihlášky) jsou ve slovnících jazyků: i18n/dictionaries, část labels.
//
// Pořadí je pevné: nejdřív účet kapitána, teprve potom tým. Tým bez kapitána
// z webu nevznikne — organizátor tak vždycky ví, kdo za tým odpovídá a jak
// ho zastihnout. Kapitán spravuje nejvýš jeden tým; přihláška týmu na turnaj
// je samostatný záznam, takže tým se dá přihlásit i na další turnaje.

import type { EntryStatus, PlayerPosition, UserRole } from "@/lib/supabase/database.types";

export type Role = UserRole;

export type Position = PlayerPosition;

export const POSITIONS: Position[] = ["goalkeeper", "defender", "midfielder", "forward"];

/**
 * Největší soupiska, když zrovna žádný turnaj nepřijímá přihlášky. Stejné
 * číslo hlídá databáze (trigger players_roster_limit).
 */
export const DEFAULT_MAX_ROSTER = 10;

export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  /** Číslo dresu. Null = zatím nepřidělené. */
  number: number | null;
  position: Position;
  birthYear: number | null;
  /** Kapitán na hřišti. Účet kapitána je vlastník týmu. */
  captain: boolean;
};

export type { EntryStatus };

export type Team = {
  id: string;
  /** Kód týmu pro komunikaci s organizátorem. */
  code: string;
  name: string;
  city: string;
  foundedYear: number | null;
  colors: string;
  note: string;
  players: Player[];
};

/** Turnaj, na který se právě přihlašuje (registration_open). */
export type OpenTournament = {
  id: string;
  name: string;
  /** Datum turnaje "RRRR-MM-DD" — formátuje se podle jazyka stránky. */
  startsOn: string;
  format: string;
  minRoster: number;
  maxRoster: number;
};

/** Přihláška týmu na konkrétní turnaj. */
export type Entry = {
  tournamentId: string;
  status: EntryStatus;
  /** Důvod zamítnutí od organizátora (migrace č. 8), jinak prázdné. */
  statusNote: string;
  /** Kdy organizátor naposledy rozhodl; null = ještě nerozhodl. */
  statusChangedAt: string | null;
  /** Kdy kapitán přihlášku poslal. */
  createdAt: string;
};

/** Přihláška týmu i s turnajem — kapitán ji vidí v přehledu i po uzávěrce přihlášek. */
export type CaptainEntry = Entry & {
  tournament: OpenTournament & { registrationOpen: boolean };
};

/** Zápas týmu z rozpisu turnaje (veřejná data). */
export type TeamMatch = {
  id: string;
  stage: string;
  kickoff: string;
  home: string;
  away: string;
  /** Hraje náš tým doma? */
  isHome: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
};

/** Přihlášený uživatel pro UI. */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
};
