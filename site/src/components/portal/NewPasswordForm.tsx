"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import Field from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import { useT } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import LocaleField from "@/i18n/LocaleField";
import { updatePasswordAction } from "@/lib/portal/actions";
import { IDLE, PASSWORD_MIN } from "@/lib/portal/validation";

/**
 * Nové heslo. Na stránce /nove-heslo (odkaz z e-mailu) jako přihlašovací
 * formulář — pole pod sebou, velké tlačítko. `inline` = v portálu na stránce
 * Můj účet: pole vedle sebe a běžné tlačítko, stejně jako formulář profilu.
 * Po uložení akce přesměruje do přehledu portálu s potvrzením.
 */
export default function NewPasswordForm({ inline = false }: { inline?: boolean }) {
  const t = useT().authForms;
  const [state, action, pending] = useActionState(updatePasswordAction, IDLE);
  const errors = state.errors ?? {};

  const fields = (
    <>
      <Field
        id="password"
        label={t.newPassword}
        hint={fmt(t.passwordHint, { n: PASSWORD_MIN })}
        error={errors.password}
      >
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

      <Field id="passwordConfirm" label={t.newPasswordConfirm} error={errors.passwordConfirm}>
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
    </>
  );

  const button = (
    <button
      type="submit"
      className={`cl-btn cl-btn--primary${inline ? "" : " cl-btn--lg cl-btn--block"}${pending ? " cl-btn--loading" : ""}`}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
    >
      <KeyRound size={inline ? 16 : 18} strokeWidth={2} aria-hidden />
      <span className="cl-btn-label">{t.saveNewPassword}</span>
    </button>
  );

  return (
    <form action={action} noValidate className={`flex flex-col ${inline ? "gap-[var(--sp-5)]" : "gap-[var(--sp-6)]"}`}>
      <LocaleField />
      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      {inline ? <div className="adm-grid adm-grid--wide">{fields}</div> : fields}

      {inline ? <div>{button}</div> : button}
    </form>
  );
}
