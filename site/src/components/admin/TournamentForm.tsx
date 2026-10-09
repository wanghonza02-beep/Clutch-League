import { saveTournamentAction } from "@/lib/admin/actions";
import type { Database } from "@/lib/supabase/database.types";
import ActionForm, { CheckInput, SelectInput, SubmitButton, TextAreaInput, TextInput } from "@/components/ui/ActionForm";

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];

/** Založení nového turnaje (bez `tournament`) i úprava stávajícího. */
export default function TournamentForm({ tournament }: { tournament?: Tournament }) {
  return (
    <ActionForm
      action={saveTournamentAction}
      idPrefix={tournament ? "trn-edit" : "trn-new"}
      hidden={tournament ? { id: tournament.id } : undefined}
      className="flex flex-col gap-[var(--sp-5)]"
    >
      <div className="adm-grid adm-grid--wide">
        <TextInput name="name" label="Název turnaje" fallback={tournament?.name} />
        <TextInput name="startsOn" label="Datum" type="date" fallback={tournament?.starts_on} />
        <TextInput
          name="edition"
          label="Sezóna (nepovinné)"
          hint="Např. Zima 2027"
          fallback={tournament?.edition}
        />
        <TextInput name="venue" label="Místo (nepovinné)" hint="Např. Praha" fallback={tournament?.venue} />
        <TextInput name="format" label="Formát (nepovinné)" hint="Např. 3 na 3" fallback={tournament?.format} />
        <TextInput
          name="matchLength"
          label="Délka zápasu (nepovinné)"
          hint="Např. 15 min"
          fallback={tournament?.match_length}
        />
      </div>

      <TextAreaInput
        name="summary"
        label="Krátký popis (nepovinné)"
        hint="Ukáže se v přehledu turnajů a na úvodní stránce."
        fallback={tournament?.summary}
      />

      <div className="adm-grid">
        <TextInput
          name="minRoster"
          label="Nejmenší soupiska"
          inputMode="numeric"
          hint="Kolik hráčů musí tým mít."
          fallback={tournament?.min_roster ?? 3}
        />
        <SelectInput
          name="status"
          label="Stav"
          fallback={tournament?.status ?? "upcoming"}
          options={[
            { value: "upcoming", label: "Nadcházející" },
            { value: "completed", label: "Odehraný (jde do archivu)" },
          ]}
        />
        <TextInput
          name="slug"
          label="Adresa stránky (nepovinné)"
          hint={tournament ? "Mění odkaz na výsledky." : "Prázdné = vytvoří se z názvu."}
          fallback={tournament?.slug}
        />
      </div>

      <CheckInput
        name="registrationOpen"
        label="Přihlášky týmů jsou otevřené (jen u jednoho nadcházejícího turnaje, ostatní se zavřou)"
        fallback={tournament?.registration_open}
      />

      <div>
        <SubmitButton>{tournament ? "Uložit turnaj" : "Založit turnaj"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
