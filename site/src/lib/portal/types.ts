// Datový model portálu tak, jak s ním pracuje UI. Databáze (Supabase) má
// vlastní tvar v snake_case — převod je v data.ts.
//
// Pořadí je pevné: nejdřív účet kapitána, teprve potom tým. Tým bez kapitána
// z webu nevznikne — organizátor tak vždycky ví, kdo za tým odpovídá a jak
// ho zastihnout. Kapitán spravuje nejvýš jeden tým; přihláška týmu na turnaj
// je samostatný záznam, takže tým se dá přihlásit i na další turnaje.

import type { EntryStatus, PlayerPosition, UserRole } from "@/lib/supabase/database.types";

export type Role = UserRole;

export const ROLE_LABEL: Record<Role, string> = {
  captain: "Kapitán týmu",
  admin: "Organizátor",
};

export type Position = PlayerPosition;

export const POSITIONS: Position[] = ["goalkeeper", "defender", "midfielder", "forward"];

export const POSITION_LABEL: Record<Position, string> = {
  goalkeeper: "Brankář",
  defender: "Obránce",
  midfielder: "Záložník",
  forward: "Útočník",
};

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

export const ENTRY_STATUS_LABEL: Record<EntryStatus, string> = {
  pending: "Čeká na schválení",
  approved: "Schváleno",
};

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
  dateLabel: string;
  format: string;
  minRoster: number;
};

/** Přihláška týmu na konkrétní turnaj. */
export type Entry = {
  tournamentId: string;
  status: EntryStatus;
};

/** Přihlášený uživatel pro UI. */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
};
