"use client";

import { useActionState } from "react";
import { RotateCw } from "lucide-react";
import Notice from "@/components/ui/Notice";
import { resendConfirmationAction } from "@/lib/portal/actions";
import { IDLE } from "@/lib/portal/validation";

/** Znovu pošle potvrzovací e-mail. Samostatný formulář — nesmí být uvnitř jiného. */
export default function ResendConfirmation({ email, next }: { email: string; next?: string }) {
  const [state, action, pending] = useActionState(resendConfirmationAction, IDLE);

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-3)]">
      <input type="hidden" name="email" value={email} />
      {next && <input type="hidden" name="next" value={next} />}

      {state.status !== "idle" && state.message && (
        <Notice tone={state.status === "ok" ? "ok" : "error"} live>
          {state.message}
        </Notice>
      )}

      <div>
        <button
          type="submit"
          className={`cl-btn cl-btn--secondary cl-btn--sm${pending ? " cl-btn--loading" : ""}`}
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
        >
          <RotateCw size={14} strokeWidth={2} aria-hidden />
          <span className="cl-btn-label">Poslat potvrzovací e-mail znovu</span>
        </button>
      </div>
    </form>
  );
}
