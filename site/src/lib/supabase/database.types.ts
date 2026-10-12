// Typy databáze podle supabase/migrations (č. 1–8).
// Při změně schématu je uprav ručně, nebo je přegeneruj:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type UserRole = "captain" | "admin";
export type EntryStatus = "pending" | "approved" | "rejected";
export type TournamentStatus = "upcoming" | "completed";
export type PlayerPosition = "goalkeeper" | "defender" | "midfielder" | "forward";
export type MatchEventKind = "goal" | "yellow_card" | "red_card";
export type Locale = "cs" | "en" | "uk" | "sk";
/** Druh oznámení (tabulka notifications, migrace č. 8). */
export type NotificationKind =
  | "entry_submitted"
  | "entry_withdrawn"
  | "entry_approved"
  | "entry_rejected"
  | "entry_returned"
  | "entry_removed";

/** Sloupce turnaje, které smí zapisovat administrátor. */
export type TournamentWrite = {
  slug: string;
  name: string;
  edition?: string;
  starts_on: string;
  venue?: string;
  format?: string;
  match_length?: string;
  summary?: string;
  photo_src?: string | null;
  photo_alt?: string | null;
  status?: TournamentStatus;
  registration_open?: boolean;
  min_roster?: number;
  max_roster?: number;
  mvp_player?: string | null;
  mvp_team_id?: string | null;
  best_keeper_player?: string | null;
  best_keeper_team_id?: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          role: UserRole;
          /** Jazyk účtu (migrace č. 8) — pro e-maily s oznámením. */
          locale: Locale;
          created_at: string;
        };
        Insert: never;
        Update: {
          full_name?: string;
          phone?: string;
        };
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          slug: string;
          name: string;
          edition: string;
          starts_on: string;
          venue: string;
          format: string;
          match_length: string;
          summary: string;
          photo_src: string | null;
          photo_alt: string | null;
          status: TournamentStatus;
          registration_open: boolean;
          min_roster: number;
          max_roster: number;
          mvp_player: string | null;
          mvp_team_id: string | null;
          best_keeper_player: string | null;
          best_keeper_team_id: string | null;
          created_at: string;
        };
        Insert: TournamentWrite;
        Update: Partial<TournamentWrite>;
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          code: string;
          name: string;
          city: string;
          founded_year: number | null;
          colors: string;
          note: string;
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          city: string;
          founded_year?: number | null;
          colors?: string;
          note?: string;
          owner_id?: string | null;
        };
        Update: {
          name?: string;
          city?: string;
          founded_year?: number | null;
          colors?: string;
          note?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_entries: {
        Row: {
          tournament_id: string;
          team_id: string;
          status: EntryStatus;
          group_label: string | null;
          final_rank: number | null;
          advanced: boolean;
          /** Důvod zamítnutí — vidí kapitán a organizátor (migrace č. 8). */
          status_note: string;
          /** Kdy organizátor naposledy změnil stav (migrace č. 8). */
          status_changed_at: string | null;
          created_at: string;
        };
        Insert: {
          tournament_id: string;
          team_id: string;
        };
        Update: {
          /** Stav mění organizátor přes admin_set_entry_status (oznámení, pojistky). */
          status?: EntryStatus;
          group_label?: string | null;
          final_rank?: number | null;
          advanced?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_entries_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_entries_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          first_name: string;
          last_name: string;
          shirt_number: number | null;
          position: PlayerPosition;
          birth_year: number | null;
          is_captain: boolean;
          created_at: string;
        };
        Insert: {
          team_id: string;
          first_name: string;
          last_name: string;
          shirt_number?: number | null;
          position: PlayerPosition;
          birth_year?: number | null;
          is_captain?: boolean;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          shirt_number?: number | null;
          position?: PlayerPosition;
          birth_year?: number | null;
          is_captain?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          stage: string;
          counts_for_table: boolean;
          kickoff: string;
          home_team_id: string;
          away_team_id: string;
          home_goals: number | null;
          away_goals: number | null;
          clutch_mode: string | null;
          created_at: string;
        };
        Insert: {
          tournament_id: string;
          stage: string;
          kickoff: string;
          home_team_id: string;
          away_team_id: string;
          clutch_mode?: string | null;
        };
        Update: {
          stage?: string;
          kickoff?: string;
          home_team_id?: string;
          away_team_id?: string;
          clutch_mode?: string | null;
          home_goals?: number | null;
          away_goals?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      match_events: {
        Row: {
          id: string;
          match_id: string;
          kind: MatchEventKind;
          team_id: string;
          first_name: string;
          last_name: string;
          minute: number;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: NotificationKind;
          tournament_id: string | null;
          team_id: string | null;
          note: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: never;
        Update: {
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      scorers: {
        Row: {
          id: string;
          tournament_id: string;
          team_id: string;
          player_name: string;
          goals: number;
        };
        Insert: {
          tournament_id: string;
          team_id: string;
          player_name: string;
          goals: number;
        };
        Update: {
          player_name?: string;
          goals?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      admin_set_entry_status: {
        Args: {
          p_tournament: string;
          p_team: string;
          p_status: EntryStatus;
          p_note?: string;
          p_delete_matches?: boolean;
        };
        /** Počet smazaných zápasů týmu. */
        Returns: number;
      };
      admin_remove_entry: {
        Args: {
          p_tournament: string;
          p_team: string;
          p_delete_matches?: boolean;
        };
        Returns: number;
      };
      admin_save_match_result: {
        Args: {
          p_match: string;
          p_home_goals: number | null;
          p_away_goals: number | null;
          p_events: {
            kind: MatchEventKind;
            team_id: string;
            first_name: string;
            last_name: string;
            minute: number;
          }[];
        };
        Returns: undefined;
      };
      register_team: {
        Args: {
          p_name: string;
          p_city: string;
          p_founded_year: number | null;
          p_colors: string;
          p_note: string;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      entry_status: EntryStatus;
      tournament_status: TournamentStatus;
      player_position: PlayerPosition;
      match_event_kind: MatchEventKind;
    };
    CompositeTypes: Record<never, never>;
  };
};
