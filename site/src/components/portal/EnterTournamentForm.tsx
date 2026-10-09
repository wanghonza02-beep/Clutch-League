"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import Notice from "@/components/ui/Notice";
import RegistrationConfirmations from "./RegistrationConfirmations";
import { enterTournamentAction } from "@/lib/portal/actions";
import { IDLE } from "@/lib/portal/validation";

/** Přihláška týmu, který už existuje (hrál dřív), na nový turnaj. */
export default function EnterTournamentForm({ tournament }: { tournament: string }) {
  const [state, action, pending] = useActionState(enterTournamentAction, IDLE);

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-6)]">
      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      <RegistrationConfirmations errors={state.errors} values={state.values} />

      <div>
        <button
          type="submit"
          className={`cl-btn cl-btn--primary cl-btn--lg w-full sm:w-auto${pending ? " cl-btn--loading" : ""}`}
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
        >
          <Send size={18} strokeWidth={2} aria-hidden />
          <span className="cl-btn-label">Přihlásit na {tournament}</span>
        </button>
      </div>
    </form>
  );
}
