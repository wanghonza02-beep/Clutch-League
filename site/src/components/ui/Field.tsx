import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Obal pole podle design systému: label, chamfered rámeček se zlatým focusem
 * a místo na nápovědu nebo chybu. Glow kreslí .cl-field__glow, protože
 * clip-path spolkne box-shadow.
 */
export default function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const message = error ?? hint;
  return (
    <div className={`cl-field${error ? " cl-field--error" : ""}`}>
      <label htmlFor={id} className="cl-field__label">
        {label}
      </label>
      <div className="cl-field__glow">
        <div className="cl-field__wrap">{children}</div>
      </div>
      {message && (
        <span id={`${id}-msg`} className="cl-field__hint">
          {message}
        </span>
      )}
    </div>
  );
}

/** Select se stejným rámečkem jako input; šipku kreslíme sami (appearance: none). */
export function SelectField({
  id,
  label,
  error,
  hint,
  children,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <span className="cl-field__selectwrap">
        <select id={id} className="cl-field__select" {...props}>
          {children}
        </select>
        <span className="cl-field__selecticon" aria-hidden>
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </span>
    </Field>
  );
}
