"use client";

import { useActionState } from "react";
import { MailCheck, Send } from "lucide-react";
import Field from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import { useT } from "@/i18n/client";
import Link from "@/i18n/Link";
import LocaleField from "@/i18n/LocaleField";
import { rich } from "@/i18n/rich";
import { forgotPasswordAction } from "@/lib/portal/actions";
import { PATHS } from "@/lib/portal/paths";
import { IDLE } from "@/lib/portal/validation";

export default function ForgotPasswordForm() {
  const t = useT().authForms;
  const [state, action, pending] = useActionState(forgotPasswordAction, IDLE);
  const errors = state.errors ?? {};

  // Po odeslání stejná odpověď pro existující i neexistující účet.
  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-[var(--sp-5)]" role="status">
        <span style={{ color: "var(--gold)" }}>
          <MailCheck size={32} strokeWidth={2} aria-hidden />
        </span>
        <p style={{ margin: 0, color: "var(--text-body)" }}>
          {rich(t.forgotSent, { email: <strong>{state.message}</strong> })}
        </p>
        <div>
          <Link href={PATHS.login} className="cl-btn cl-btn--secondary">
            <span>{t.backToLogin}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-6)]">
      <LocaleField />
      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      <Field id="email" label={t.accountEmail} error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby="email-msg"
          className="cl-field__input"
        />
      </Field>

      <button
        type="submit"
        className={`cl-btn cl-btn--primary cl-btn--lg cl-btn--block${pending ? " cl-btn--loading" : ""}`}
        aria-disabled={pending || undefined}
        aria-busy={pending || undefined}
      >
        <Send size={18} strokeWidth={2} aria-hidden />
        <span className="cl-btn-label">{t.sendLink}</span>
      </button>

      <p className="cl-field__hint">
        {rich(t.rememberPassword, {
          link: (
            <Link href={PATHS.login} style={{ color: "var(--text-link)" }}>
              {t.haveAccountLink}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
