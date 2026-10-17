import { Banknote, Undo2 } from "lucide-react";
import ActionForm, { SubmitButton } from "@/components/ui/ActionForm";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { setEntryPaidAction } from "@/lib/admin/actions";
import type { EntryStatus } from "@/lib/portal/types";

/**
 * Startovné u přihlášky (Přihlášky → turnaj → karta týmu): „Startovné přijato“,
 * nebo zrušit zaplacení. Schválit přihlášku jde až po zaplacení; schválené
 * přihlášce zaplacení zrušit nejde (hlídá i databáze).
 */
export default async function EntryPayment({
  tournamentId,
  teamId,
  status,
  paid,
  amount,
}: {
  tournamentId: string;
  teamId: string;
  status: EntryStatus;
  paid: boolean;
  /** Startovné už naformátované („2 700 Kč“). */
  amount: string;
}) {
  const t = (await getDictionary()).admin;

  if (paid && status === "approved") return <p className="adm-meta">{t.feeLockedApproved}</p>;

  return (
    <ActionForm
      action={setEntryPaidAction}
      idPrefix={`pay-${teamId}`}
      hidden={{ tournamentId, teamId, paid: paid ? "" : "1" }}
      className="flex flex-col gap-[var(--sp-2)]"
    >
      <div>
        <SubmitButton
          variant={paid ? "ghost" : "secondary"}
          size="sm"
          flush={paid}
          confirm={paid ? t.feeUnmarkConfirm : fmt(t.feeMarkConfirm, { amount })}
          icon={paid ? <Undo2 size={14} strokeWidth={2} aria-hidden /> : <Banknote size={14} strokeWidth={2} aria-hidden />}
        >
          {paid ? t.feeUnmark : t.feeMark}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
