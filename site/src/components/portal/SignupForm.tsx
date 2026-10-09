"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck, UserPlus } from "lucide-react";
import Field from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import ResendConfirmation from "./ResendConfirmation";
import { signupAction } from "@/lib/portal/actions";
import { PATHS, withNext } from "@/lib/portal/paths";
import { IDLE, PASSWORD_MIN } from "@/lib/portal/validation";

/** Vytvoření účtu — první krok před přihláškou týmu. */
export default function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signupAction, IDLE);
  const values = state.values ?? {};
  const errors = state.errors ?? {};

  // Účet vznikl, ale čeká na potvrzení e-mailem (výchozí nastavení Supabase).
  if (state.status === "ok" && values.email) {
    return (
      <div className="flex flex-col gap-[var(--sp-5)]" role="status">
        <span style={{ color: "var(--gold)" }}>
          <MailCheck size={32} strokeWidth={2} aria-hidden />
        </span>
        <h2
          className="cl-display"
          style={{ fontSize: "var(--fs-h3)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
        >
          Zkontroluj e-mail
        </h2>
        <p style={{ margin: 0, color: "var(--text-body)" }}>
          Poslali jsme ti e-mail na <strong>{values.email}</strong>. Klikni na odkaz v něm — tím
          se účet potvrdí a pustíme tě rovnou k přihlášce týmu. Nic nepřišlo? Mrkni do spamu.
        </p>
        <ResendConfirmation email={values.email} next={values.next} />
      </div>
    );
  }

  const input = (name: string) => ({
    id: name,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": `${name}-msg`,
    className: "cl-field__input",
  });

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-6)]">
      {next && <input type="hidden" name="next" value={next} />}

      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      <div
        className="grid gap-[var(--sp-5)]"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
      >
        <Field id="name" label="Jméno a příjmení" error={errors.name}>
          <input
            {...input("name")}
            type="text"
            required
            autoComplete="name"
            defaultValue={values.name ?? ""}
          />
        </Field>

        <Field
          id="phone"
          label="Telefon"
          hint="Např. +420 777 123 456"
          error={errors.phone}
        >
          <input
            {...input("phone")}
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            defaultValue={values.phone ?? ""}
          />
        </Field>
      </div>

      <Field
        id="email"
        label="E-mail"
        hint="Tímhle e-mailem se budeš přihlašovat."
        error={errors.email}
      >
        <input
          {...input("email")}
          type="email"
          required
          autoComplete="email"
          defaultValue={values.email ?? ""}
        />
      </Field>

      <div
        className="grid gap-[var(--sp-5)]"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
      >
        <Field
          id="password"
          label="Heslo"
          hint={`Aspoň ${PASSWORD_MIN} znaků.`}
          error={errors.password}
        >
          <input
            {...input("password")}
            type="password"
            required
            minLength={PASSWORD_MIN}
            autoComplete="new-password"
          />
        </Field>

        <Field id="passwordConfirm" label="Heslo znovu" error={errors.passwordConfirm}>
          <input
            {...input("passwordConfirm")}
            type="password"
            required
            autoComplete="new-password"
          />
        </Field>
      </div>

      <div className="flex flex-col gap-[var(--sp-1)]">
        <label className="cl-check cl-check--top">
          <input
            type="checkbox"
            name="consent"
            required
            defaultChecked={values.consent === "on"}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-msg" : undefined}
          />
          <span>
            Souhlasím se zpracováním svých osobních údajů (jméno, e-mail, telefon) pro účely
            organizace turnajů Clutch League.
          </span>
        </label>
        {errors.consent && (
          <span id="consent-msg" className="cl-field__hint cl-check__error">
            {errors.consent}
          </span>
        )}
      </div>

      <button
        type="submit"
        className={`cl-btn cl-btn--primary cl-btn--lg cl-btn--block${pending ? " cl-btn--loading" : ""}`}
        aria-disabled={pending || undefined}
        aria-busy={pending || undefined}
      >
        <UserPlus size={18} strokeWidth={2} aria-hidden />
        <span className="cl-btn-label">Vytvořit účet</span>
      </button>

      <p className="cl-field__hint">
        Už máš účet?{" "}
        <Link href={withNext(PATHS.login, next)} style={{ color: "var(--text-link)" }}>
          Přihlas se
        </Link>
        .
      </p>
    </form>
  );
}
