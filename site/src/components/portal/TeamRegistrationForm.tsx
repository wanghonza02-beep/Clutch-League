"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import Notice from "@/components/ui/Notice";
import RegistrationConfirmations from "./RegistrationConfirmations";
import TeamFields from "./TeamFields";
import { registerTeamAction } from "@/lib/portal/actions";
import { IDLE } from "@/lib/portal/validation";

/** Přihláška nového týmu. Kapitán je známý z účtu, tady se ptáme jen na tým. */
export default function TeamRegistrationForm() {
  const [state, action, pending] = useActionState(registerTeamAction, IDLE);
  const errors = state.errors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-6)]">
      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      <TeamFields errors={errors} values={state.values} />
      <RegistrationConfirmations errors={errors} values={state.values} />

      <div>
        <button
          type="submit"
          className={`cl-btn cl-btn--primary cl-btn--lg w-full sm:w-auto${pending ? " cl-btn--loading" : ""}`}
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
        >
          <Send size={18} strokeWidth={2} aria-hidden />
          <span className="cl-btn-label">Odeslat přihlášku</span>
        </button>
      </div>
    </form>
  );
}
