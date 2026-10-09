"use client";

import { createContext, useActionState, useContext, useState, type ReactNode } from "react";
import Field, { SelectField } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import { IDLE, type FormState } from "@/lib/portal/validation";

// Obecný formulář administrace. Stránka (serverová) skládá formulář z polí
// níže; ta si z kontextu berou chyby a hodnoty po neúspěšném odeslání, takže
// se do nich nepředávají funkce (to by ze server komponenty nešlo).

type Ctx = {
  errors: Record<string, string>;
  values: Record<string, string>;
  pending: boolean;
  idPrefix: string;
};

const FormCtx = createContext<Ctx | null>(null);

function useForm(): Ctx {
  const ctx = useContext(FormCtx);
  if (!ctx) throw new Error("Pole formuláře musí být uvnitř <ActionForm>.");
  return ctx;
}

export default function ActionForm({
  action,
  idPrefix,
  hidden,
  className = "flex flex-col gap-[var(--sp-4)]",
  /** Zprávu o úspěchu u drobných tlačítek (smazat, schválit) ukáže pod formulářem. */
  children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Unikátní předpona id polí — na stránce bývá formulářů víc. */
  idPrefix: string;
  /** Skrytá pole, třeba id řádku. */
  hidden?: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);

  return (
    <FormCtx.Provider
      value={{ errors: state.errors ?? {}, values: state.values ?? {}, pending, idPrefix }}
    >
      <form action={formAction} noValidate className={className}>
        {hidden &&
          Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        {children}
        {state.status !== "idle" && state.message && (
          <Notice tone={state.status === "ok" ? "ok" : "error"} live>
            {state.message}
          </Notice>
        )}
      </form>
    </FormCtx.Provider>
  );
}

/** Tlačítko odeslání. `confirm` ho změní na dvoukrokové (Opravdu? Ano / Zrušit). */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  confirm,
  icon,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  confirm?: string;
  icon?: ReactNode;
}) {
  const { pending } = useForm();
  const [asking, setAsking] = useState(false);
  const cls = `cl-btn cl-btn--${variant}${size === "sm" ? " cl-btn--sm" : ""}${pending ? " cl-btn--loading" : ""}`;

  if (confirm && !asking) {
    return (
      <button type="button" className={cls} onClick={() => setAsking(true)}>
        {icon}
        <span>{children}</span>
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-[var(--sp-2)]">
      {confirm && <span className="roster-row__meta">{confirm}</span>}
      <button
        type="submit"
        className={cls}
        aria-disabled={pending || undefined}
        aria-busy={pending || undefined}
        onClick={() => {
          // Odeslání proběhne; po něm se tlačítko vrátí do výchozího stavu.
          if (confirm) setTimeout(() => setAsking(false), 0);
        }}
      >
        {icon}
        <span className="cl-btn-label">{confirm ? "Ano" : children}</span>
      </button>
      {confirm && (
        <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={() => setAsking(false)}>
          <span>Zrušit</span>
        </button>
      )}
    </span>
  );
}

type BaseProps = {
  name: string;
  label: string;
  /** Hodnota, dokud uživatel nic neodeslal (typicky aktuální stav z databáze). */
  fallback?: string | number | null;
  hint?: string;
};

export function TextInput({
  name,
  label,
  fallback,
  hint,
  type = "text",
  inputMode,
  placeholder,
}: BaseProps & { type?: "text" | "date" | "datetime-local"; inputMode?: "numeric" | "text"; placeholder?: string }) {
  const { errors, values, idPrefix } = useForm();
  const id = `${idPrefix}-${name}`;
  return (
    <Field id={id} label={label} hint={hint} error={errors[name]}>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        defaultValue={values[name] ?? (fallback ?? "").toString()}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={`${id}-msg`}
        className="cl-field__input"
      />
    </Field>
  );
}

export function TextAreaInput({ name, label, fallback, hint }: BaseProps) {
  const { errors, values, idPrefix } = useForm();
  const id = `${idPrefix}-${name}`;
  return (
    <Field id={id} label={label} hint={hint} error={errors[name]}>
      <textarea
        id={id}
        name={name}
        defaultValue={values[name] ?? (fallback ?? "").toString()}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={`${id}-msg`}
        className="cl-field__textarea"
      />
    </Field>
  );
}

export function SelectInput({
  name,
  label,
  fallback,
  hint,
  options,
  emptyLabel,
}: BaseProps & {
  options: { value: string; label: string }[];
  /** Přidá první volbu s prázdnou hodnotou (např. „Vyber tým“). */
  emptyLabel?: string;
}) {
  const { errors, values, idPrefix } = useForm();
  const id = `${idPrefix}-${name}`;
  return (
    <SelectField
      id={id}
      label={label}
      hint={hint}
      error={errors[name]}
      name={name}
      defaultValue={values[name] ?? (fallback ?? "").toString()}
      aria-describedby={`${id}-msg`}
    >
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </SelectField>
  );
}

export function CheckInput({
  name,
  label,
  fallback,
}: {
  name: string;
  label: string;
  fallback?: boolean;
}) {
  const { values, idPrefix } = useForm();
  const checked = name in values ? values[name] === "on" : Boolean(fallback);
  return (
    <label className="cl-check cl-check--top" htmlFor={`${idPrefix}-${name}`}>
      <input id={`${idPrefix}-${name}`} type="checkbox" name={name} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}
