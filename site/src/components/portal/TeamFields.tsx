import Field from "@/components/ui/Field";
import { NOTE_MAX } from "@/lib/portal/validation";
import type { Team } from "@/lib/portal/types";

/**
 * Pole týmu sdílená přihláškou (nový tým) i úpravou v portálu.
 * Po chybě má přednost to, co uživatel odeslal, jinak aktuální stav týmu.
 */
export default function TeamFields({
  team,
  errors = {},
  values = {},
}: {
  team?: Team;
  errors?: Record<string, string>;
  values?: Record<string, string>;
}) {
  const value = (field: string, fallback: string) => values[field] ?? fallback;

  return (
    <>
      <div
        className="grid gap-[var(--sp-5)]"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
      >
        <Field id="name" label="Název týmu" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="off"
            defaultValue={value("name", team?.name ?? "")}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby="name-msg"
            className="cl-field__input"
          />
        </Field>

        <Field id="city" label="Město" error={errors.city}>
          <input
            id="city"
            name="city"
            type="text"
            required
            autoComplete="address-level2"
            defaultValue={value("city", team?.city ?? "")}
            aria-invalid={errors.city ? true : undefined}
            aria-describedby="city-msg"
            className="cl-field__input"
          />
        </Field>

        <Field
          id="foundedYear"
          label="Rok založení (nepovinné)"
          hint="Např. 2024"
          error={errors.foundedYear}
        >
          <input
            id="foundedYear"
            name="foundedYear"
            type="text"
            inputMode="numeric"
            defaultValue={value("foundedYear", team?.foundedYear?.toString() ?? "")}
            aria-invalid={errors.foundedYear ? true : undefined}
            aria-describedby="foundedYear-msg"
            className="cl-field__input"
          />
        </Field>

        <Field
          id="colors"
          label="Barvy týmu (nepovinné)"
          hint="Např. černá / žlutá"
          error={errors.colors}
        >
          <input
            id="colors"
            name="colors"
            type="text"
            defaultValue={value("colors", team?.colors ?? "")}
            aria-describedby="colors-msg"
            className="cl-field__input"
          />
        </Field>
      </div>

      <Field id="note" label="Poznámka pro organizátora (nepovinné)" error={errors.note}>
        <textarea
          id="note"
          name="note"
          maxLength={NOTE_MAX}
          defaultValue={value("note", team?.note ?? "")}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby="note-msg"
          className="cl-field__textarea"
        />
      </Field>
    </>
  );
}
