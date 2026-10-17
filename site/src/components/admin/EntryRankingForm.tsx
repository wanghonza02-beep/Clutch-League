import ActionForm, { CheckInput, SubmitButton, TextInput } from "@/components/ui/ActionForm";
import { getDictionary } from "@/i18n/server";
import { saveEntryRankingAction } from "@/lib/admin/actions";
import type { AdminEntryRow } from "@/lib/admin/data";

/**
 * Formulář: skupina, konečné pořadí a postup jednoho (schváleného) týmu na
 * turnaji. Je jen v kartě týmu v Zapsat výsledky (TeamResultCard).
 */
export async function RankingForm({ tournamentId, entry }: { tournamentId: string; entry: AdminEntryRow }) {
  const dict = await getDictionary();
  const t = dict.admin;

  return (
    <ActionForm
      action={saveEntryRankingAction}
      idPrefix={`rk-${entry.teamId}`}
      hidden={{ tournamentId, teamId: entry.teamId }}
      className="flex flex-col gap-[var(--sp-3)]"
    >
      <div className="adm-grid" style={{ gridTemplateColumns: "repeat(2, minmax(100px, 160px))" }}>
        <TextInput name="groupLabel" label={t.group} fallback={entry.groupLabel} />
        <TextInput name="finalRank" label={t.finalRank} inputMode="numeric" fallback={entry.finalRank} />
      </div>
      <CheckInput name="advanced" label={t.advanced} fallback={entry.advanced} />
      <div>
        <SubmitButton size="sm" variant="secondary">
          {dict.common.save}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
