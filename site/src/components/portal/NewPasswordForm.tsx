"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import Field from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import { updatePasswordAction } from "@/lib/portal/actions";
import { IDLE, PASSWORD_MIN } from "@/lib/portal/validation";

export default function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, IDLE);
  const errors = state.errors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-6)]">
      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      <Field id="password" label="Nové heslo" hint={`Aspoň ${PASSWORD_MIN} znaků.`} error={errors.password}>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={PASSWORD_MIN}
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby="password-msg"
          className="cl-field__input"
        />
      </Field>

      <Field id="passwordConfirm" label="Nové heslo znovu" error={errors.passwordConfirm}>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={errors.passwordConfirm ? true : undefined}
          aria-describedby="passwordConfirm-msg"
          className="cl-field__input"
        />
      </Field>

      <button
        type="submit"
        className={`cl-btn cl-btn--primary cl-btn--lg cl-btn--block${pending ? " cl-btn--loading" : ""}`}
        aria-disabled={pending || undefined}
        aria-busy={pending || undefined}
      >
        <KeyRound size={18} strokeWidth={2} aria-hidden />
        <span className="cl-btn-label">Uložit nové heslo</span>
      </button>
    </form>
  );
}
