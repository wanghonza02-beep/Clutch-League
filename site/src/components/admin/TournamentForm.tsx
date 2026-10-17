import { saveTournamentAction } from "@/lib/admin/actions";
import { DEFAULT_MAX_ROSTER } from "@/lib/portal/types";
import type { Database } from "@/lib/supabase/database.types";
import { STATUSES, isPublished, startTimeOf, tournamentSummaries } from "@/lib/tournamentModel";
import { getDictionary } from "@/i18n/server";
import ActionForm, { CheckInput, SelectInput, SubmitButton, TextAreaInput, TextInput } from "@/components/ui/ActionForm";

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];

/**
 * Založení nového turnaje (bez `tournament`) i úprava stávajícího (Rozpis
 * turnajů). Název je značka a nepřekládá se; popis má pole pro každý jazyk webu.
 * Nový turnaj je skrytý z webu, dokud organizátor nezaškrtne „Zobrazit na webu“.
 * Přihlášky se tady neotevírají — na to je přepínač v přehledu turnaje.
 */
export default async function TournamentForm({ tournament }: { tournament?: Tournament }) {
  const dict = await getDictionary();
  const t = dict.admin;
  const summary = tournament ? tournamentSummaries(tournament) : null;

  return (
    <ActionForm
      action={saveTournamentAction}
      idPrefix={tournament ? "trn-edit" : "trn-new"}
      hidden={tournament ? { id: tournament.id } : undefined}
      className="flex flex-col gap-[var(--sp-5)]"
    >
      <div className="adm-grid adm-grid--wide">
        <TextInput name="name" label={t.name} hint={t.nameHint} fallback={tournament?.name} />
        <TextInput name="startsOn" label={t.date} type="date" fallback={tournament?.starts_on} />
        <TextInput
          name="startTime"
          label={t.startTime}
          type="time"
          hint={t.startTimeHint}
          fallback={tournament ? startTimeOf(tournament) : null}
        />
        <TextInput name="venue" label={t.venue} hint={t.venueHint} fallback={tournament?.venue} />
        <TextInput name="format" label={t.format} hint={t.formatHint} fallback={tournament?.format} />
        <TextInput
          name="matchLength"
          label={t.matchLength}
          hint={t.matchLengthHint}
          fallback={tournament?.match_length}
        />
        <TextInput name="edition" label={t.edition} hint={t.editionHint} fallback={tournament?.edition} />
      </div>

      <div className="adm-grid">
        <SelectInput
          name="status"
          label={t.status}
          hint={t.statusHint}
          fallback={tournament?.status ?? "upcoming"}
          options={STATUSES.map((status) => ({ value: status, label: t.statusOptions[status] }))}
        />
        <TextInput
          name="entryFee"
          label={t.entryFee}
          inputMode="numeric"
          hint={t.entryFeeHint}
          fallback={tournament?.entry_fee}
        />
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
        <TextInput
          name="slug"
          label={t.slug}
          hint={tournament ? t.slugHintEdit : t.slugHintNew}
          fallback={tournament?.slug}
        />
      </div>

      <div className="flex flex-col gap-[var(--sp-2)]">
        <CheckInput name="published" label={t.publishedCheck} fallback={tournament ? isPublished(tournament) : false} />
        <p className="cl-field__hint" style={{ margin: 0 }}>
          {t.publishedHint}
        </p>
      </div>

      <div className="adm-grid adm-grid--wide">
        <TextAreaInput name="summary" label={t.summaryCs} hint={t.summaryHint} fallback={summary?.cs} />
        <TextAreaInput name="summaryEn" label={t.summaryEn} hint={t.summaryOtherHint} fallback={summary?.en} />
        <TextAreaInput name="summaryUk" label={t.summaryUk} hint={t.summaryOtherHint} fallback={summary?.uk} />
        <TextAreaInput name="summarySk" label={t.summarySk} hint={t.summaryOtherHint} fallback={summary?.sk} />
      </div>

      <div>
        <SubmitButton>{tournament ? t.saveTournament : t.createTournament}</SubmitButton>
      </div>
    </ActionForm>
  );
}
