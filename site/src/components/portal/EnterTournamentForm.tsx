"use client";

import { useActionState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Notice from "@/components/ui/Notice";
import { EntryFormProvider } from "./EntryForm";
import { useT } from "@/i18n/client";
import LocaleField from "@/i18n/LocaleField";
import { enterTournamentAction } from "@/lib/portal/actions";
import { IDLE } from "@/lib/portal/validation";

/**
 * Přihláška týmu, který už existuje (hrál dřív), na nový turnaj: jen krok
 * platby startovného a podmínek účasti (`paymentStep`, vykreslí server).
 */
export default function EnterTournamentForm({ teamName, paymentStep }: { teamName: string; paymentStep: ReactNode }) {
  const t = useT().teamForms;
  const [state, action, pending] = useActionState(enterTournamentAction, IDLE);

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-6)]">
      <LocaleField />
      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      <EntryFormProvider errors={state.errors} values={state.values} teamName={teamName}>
        {paymentStep}
      </EntryFormProvider>

      <div>
        <button
          type="submit"
          className={`cl-btn cl-btn--primary cl-btn--lg w-full sm:w-auto${pending ? " cl-btn--loading" : ""}`}
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
        >
          <span className="cl-btn-label">{t.submitEntry}</span>
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </form>
  );
}
