import { saveTournamentAction } from "@/lib/admin/actions";
import { DEFAULT_MAX_ROSTER } from "@/lib/portal/types";
import type { Database } from "@/lib/supabase/database.types";
import { getDictionary } from "@/i18n/server";
import ActionForm, { CheckInput, SelectInput, SubmitButton, TextAreaInput, TextInput } from "@/components/ui/ActionForm";

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];

/** Založení nového turnaje (bez `tournament`) i úprava stávajícího. */
export default async function TournamentForm({ tournament }: { tournament?: Tournament }) {
  const t = (await getDictionary()).admin;

  return (
    <ActionForm
      action={saveTournamentAction}
      idPrefix={tournament ? "trn-edit" : "trn-new"}
      hidden={tournament ? { id: tournament.id } : undefined}
      className="flex flex-col gap-[var(--sp-5)]"
    >
      <div className="adm-grid adm-grid--wide">
        <TextInput name="name" label={t.name} fallback={tournament?.name} />
        <TextInput name="startsOn" label={t.date} type="date" fallback={tournament?.starts_on} />
        <TextInput name="edition" label={t.edition} hint={t.editionHint} fallback={tournament?.edition} />
        <TextInput name="venue" label={t.venue} hint={t.venueHint} fallback={tournament?.venue} />
        <TextInput name="format" label={t.format} hint={t.formatHint} fallback={tournament?.format} />
        <TextInput
          name="matchLength"
          label={t.matchLength}
          hint={t.matchLengthHint}
          fallback={tournament?.match_length}
        />
      </div>

      <TextAreaInput name="summary" label={t.summary} hint={t.summaryHint} fallback={tournament?.summary} />

      <div className="adm-grid">
        <TextInput
          name="minRoster"
          label={t.minRoster}
          inputMode="numeric"
          hint={t.minRosterHint}
          fallback={tournament?.min_roster ?? 6}
        />
        <TextInput
          name="maxRoster"
          label={t.maxRoster}
          inputMode="numeric"
          hint={t.maxRosterHint}
          fallback={tournament?.max_roster ?? DEFAULT_MAX_ROSTER}
        />
        <SelectInput
          name="status"
          label={t.status}
          fallback={tournament?.status ?? "upcoming"}
          options={[
            { value: "upcoming", label: t.statusUpcoming },
            { value: "completed", label: t.statusCompleted },
          ]}
        />
        <TextInput
          name="slug"
          label={t.slug}
          hint={tournament ? t.slugHintEdit : t.slugHintNew}
          fallback={tournament?.slug}
        />
      </div>

      <CheckInput name="registrationOpen" label={t.registrationOpenCheck} fallback={tournament?.registration_open} />

      <div>
        <SubmitButton>{tournament ? t.saveTournament : t.createTournament}</SubmitButton>
      </div>
    </ActionForm>
  );
}
