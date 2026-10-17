import { DoorClosed, DoorOpen } from "lucide-react";
import ActionForm, { SubmitButton } from "@/components/ui/ActionForm";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { setRegistrationAction } from "@/lib/admin/actions";
import type { AdminTournamentInfo } from "@/lib/admin/data";

/**
 * „Přihlášky otevřené / zavřené“ v liště přehledu nadcházejícího turnaje —
 * jediné místo, kde se přihlášky otevírají a zavírají. Otevřít jde jen turnaj
 * zobrazený na webu; když má přihlášky otevřené jiný turnaj, potvrzení řekne,
 * že se mu zavřou. Zavřené přihlášky zablokuje i server a databáze.
 */
export default async function RegistrationToggle({
  tournament,
  otherOpen,
}: {
  tournament: AdminTournamentInfo;
  /** Turnaj, který má přihlášky otevřené teď (jiný než tenhle), nebo null. */
  otherOpen: string | null;
}) {
  const t = (await getDictionary()).admin;
  const open = tournament.registrationOpen;
  const canOpen = tournament.published;

  return (
    <div className="reg-toggle">
      <span className={open ? "cl-badge" : "cl-badge cl-badge--neutral"}>
        {open ? t.registrationOpenState : t.registrationClosedState}
      </span>
      {open || canOpen ? (
        <ActionForm
          action={setRegistrationAction}
          idPrefix={`reg-${tournament.id}`}
          hidden={{ tournamentId: tournament.id, open: open ? "" : "1" }}
          className="reg-toggle__form"
        >
          <SubmitButton
            variant={open ? "secondary" : "primary"}
            size="sm"
            confirm={open ? t.closeRegistrationConfirm : otherOpen ? fmt(t.openRegistrationConfirm, { name: otherOpen }) : undefined}
            icon={open ? <DoorClosed size={14} strokeWidth={2} aria-hidden /> : <DoorOpen size={14} strokeWidth={2} aria-hidden />}
          >
            {open ? t.closeRegistration : t.openRegistration}
          </SubmitButton>
        </ActionForm>
      ) : (
        <span className="adm-meta">{t.registrationOnlyPublished}</span>
      )}
    </div>
  );
}
