import ActionForm, { CheckInput, SubmitButton, TextInput } from "@/components/ui/ActionForm";
import { saveEntryRankingAction } from "@/lib/admin/actions";
import type { AdminEntryRow } from "@/lib/admin/data";
import { ENTRY_STATUS_LABEL } from "@/lib/portal/types";

/** Skupina, konečné pořadí a postup jednoho týmu na turnaji. */
export default function EntryRankingForm({ tournamentId, entry }: { tournamentId: string; entry: AdminEntryRow }) {
  return (
    <li className="adm-item" style={{ gap: "var(--sp-3)" }}>
      <div className="adm-item__head">
        <span className="adm-item__title">{entry.teamName}</span>
        <span className={entry.status === "approved" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
          {ENTRY_STATUS_LABEL[entry.status]}
        </span>
        <span className="adm-meta">{entry.city}</span>
      </div>
      <ActionForm
        action={saveEntryRankingAction}
        idPrefix={`rk-${entry.teamId}`}
        hidden={{ tournamentId, teamId: entry.teamId }}
        className="flex flex-col gap-[var(--sp-3)]"
      >
        <div className="adm-grid" style={{ gridTemplateColumns: "repeat(2, minmax(100px, 160px))" }}>
          <TextInput name="groupLabel" label="Skupina" fallback={entry.groupLabel} />
          <TextInput name="finalRank" label="Konečné pořadí" inputMode="numeric" fallback={entry.finalRank} />
        </div>
        <CheckInput name="advanced" label="Postoupil ze skupiny" fallback={entry.advanced} />
        <div>
          <SubmitButton size="sm" variant="secondary">
            Uložit
          </SubmitButton>
        </div>
      </ActionForm>
    </li>
  );
}
