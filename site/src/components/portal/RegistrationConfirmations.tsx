import type { ReactNode } from "react";
import { useHomePath, useT } from "@/i18n/client";
import { rich } from "@/i18n/rich";

function Confirmation({
  name,
  checked,
  error,
  children,
}: {
  name: string;
  /** Stav po neúspěšném odeslání — React formulář po akci resetuje. */
  checked: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[var(--sp-1)]">
      <label className="cl-check cl-check--top">
        <input
          type="checkbox"
          name={name}
          required
          defaultChecked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-msg` : undefined}
        />
        <span>{children}</span>
      </label>
      {error && (
        <span id={`${name}-msg`} className="cl-field__hint cl-check__error">
          {error}
        </span>
      )}
    </div>
  );
}

/** Povinná potvrzení u každé přihlášky týmu na turnaj. */
export default function RegistrationConfirmations({
  errors = {},
  values = {},
}: {
  errors?: Record<string, string>;
  values?: Record<string, string>;
}) {
  const t = useT().teamForms;
  const home = useHomePath();
  const checked = (name: string) => values[name] === "on";

  return (
    <fieldset className="flex flex-col gap-[var(--sp-4)]">
      <legend className="cl-field__label" style={{ marginBottom: "var(--sp-3)" }}>
        {t.confirmations}
      </legend>
      <Confirmation name="confirmRules" checked={checked("confirmRules")} error={errors.confirmRules}>
        {rich(t.confirmRules, {
          link: (
            <a href={`${home}#pravidla`} target="_blank" rel="noopener">
              {t.confirmRulesLink}
            </a>
          ),
        })}
      </Confirmation>
      <Confirmation name="confirmHealth" checked={checked("confirmHealth")} error={errors.confirmHealth}>
        {t.confirmHealth}
      </Confirmation>
      <Confirmation
        name="confirmAuthority"
        checked={checked("confirmAuthority")}
        error={errors.confirmAuthority}
      >
        {t.confirmAuthority}
      </Confirmation>
    </fieldset>
  );
}
