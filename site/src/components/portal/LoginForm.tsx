"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import Field from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import ResendConfirmation from "./ResendConfirmation";
import { loginAction } from "@/lib/portal/actions";
import { PATHS, withNext } from "@/lib/portal/paths";
import { IDLE } from "@/lib/portal/validation";

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, IDLE);
  const values = state.values ?? {};
  const errors = state.errors ?? {};
  const unconfirmed = state.status === "error" && values.unconfirmed === "on";

  return (
    <div className="flex flex-col gap-[var(--sp-6)]">
      <form action={action} noValidate className="flex flex-col gap-[var(--sp-6)]">
        {next && <input type="hidden" name="next" value={next} />}

        {state.status === "error" && state.message && (
          <Notice tone="error" live>
            {state.message}
          </Notice>
        )}

        <Field id="email" label="E-mail" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={values.email ?? ""}
            autoComplete="email"
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby="email-msg"
            className="cl-field__input"
          />
        </Field>

        <div className="flex flex-col gap-[var(--sp-2)]">
          <Field id="password" label="Heslo" error={errors.password}>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={errors.password ? true : undefined}
              aria-describedby="password-msg"
              className="cl-field__input"
            />
          </Field>
          <Link
            href={PATHS.forgotPassword}
            className="cl-field__hint self-end"
            style={{ color: "var(--text-link)" }}
          >
            Zapomenuté heslo?
          </Link>
        </div>

        <button
          type="submit"
          className={`cl-btn cl-btn--primary cl-btn--lg cl-btn--block${pending ? " cl-btn--loading" : ""}`}
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
        >
          <LogIn size={18} strokeWidth={2} aria-hidden />
          <span className="cl-btn-label">Přihlásit se</span>
        </button>

        <p className="cl-field__hint">
          Ještě nemáš účet?{" "}
          <Link href={withNext(PATHS.signup, next)} style={{ color: "var(--text-link)" }}>
            Vytvoř si účet
          </Link>
          . Bez něj tým přihlásit nejde.
        </p>
      </form>

      {unconfirmed && values.email && <ResendConfirmation email={values.email} next={next} />}
    </div>
  );
}
