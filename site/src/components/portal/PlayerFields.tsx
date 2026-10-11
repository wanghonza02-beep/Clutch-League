"use client";

import Field, { SelectField } from "@/components/ui/Field";
import { useT } from "@/i18n/client";
import { POSITIONS, type Player } from "@/lib/portal/types";

/**
 * Pole hráče sdílená formulářem pro přidání i úpravu. `idPrefix` drží id
 * unikátní, když je na stránce víc formulářů najednou.
 */
export default function PlayerFields({
  idPrefix,
  player,
  errors = {},
  values = {},
}: {
  idPrefix: string;
  player?: Player;
  errors?: Record<string, string>;
  values?: Record<string, string>;
}) {
  const { teamForms: t, labels } = useT();
  const id = (field: string) => `${idPrefix}-${field}`;
  const value = (field: string, fallback: string) => values[field] ?? fallback;

  return (
    <>
      <div
        className="cl-fields grid gap-[var(--sp-5)]"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        <Field id={id("firstName")} label={t.firstName} error={errors.firstName}>
          <input
            id={id("firstName")}
            name="firstName"
            type="text"
            required
            defaultValue={value("firstName", player?.firstName ?? "")}
            aria-invalid={errors.firstName ? true : undefined}
            aria-describedby={`${id("firstName")}-msg`}
            className="cl-field__input"
          />
        </Field>

        <Field id={id("lastName")} label={t.lastName} error={errors.lastName}>
          <input
            id={id("lastName")}
            name="lastName"
            type="text"
            required
            defaultValue={value("lastName", player?.lastName ?? "")}
            aria-invalid={errors.lastName ? true : undefined}
            aria-describedby={`${id("lastName")}-msg`}
            className="cl-field__input"
          />
        </Field>

        <Field
          id={id("birthYear")}
          label={t.birthYear}
          hint={t.birthYearHint}
          error={errors.birthYear}
        >
          <input
            id={id("birthYear")}
            name="birthYear"
            type="text"
            inputMode="numeric"
            required
            defaultValue={value("birthYear", player?.birthYear?.toString() ?? "")}
            aria-invalid={errors.birthYear ? true : undefined}
            aria-describedby={`${id("birthYear")}-msg`}
            className="cl-field__input"
          />
        </Field>

        <SelectField
          id={id("position")}
          label={t.position}
          name="position"
          required
          defaultValue={value("position", player?.position ?? "forward")}
          error={errors.position}
          aria-describedby={`${id("position")}-msg`}
        >
          {POSITIONS.map((position) => (
            <option key={position} value={position}>
              {labels.positions[position]}
            </option>
          ))}
        </SelectField>

        <Field id={id("number")} label={t.number} hint={t.numberHint} error={errors.number}>
          <input
            id={id("number")}
            name="number"
            type="text"
            inputMode="numeric"
            defaultValue={value("number", player?.number?.toString() ?? "")}
            aria-invalid={errors.number ? true : undefined}
            aria-describedby={`${id("number")}-msg`}
            className="cl-field__input"
          />
        </Field>
      </div>

      <label className="cl-check">
        <input
          type="checkbox"
          name="captain"
          defaultChecked={values.captain !== undefined ? values.captain === "on" : player?.captain}
        />
        {t.captain}
      </label>
    </>
  );
}
