import { POSITIONS, type Position } from "./types";

/** Stav formuláře vracený server akcemi do `useActionState`. */
export type FormState = {
  status: "idle" | "ok" | "error";
  /** Souhrnná hláška nad formulářem. */
  message?: string;
  /** Chyby po jednotlivých polích. */
  errors?: Record<string, string>;
  /** Vyplněné hodnoty, aby se formulář po chybě neodmazal. Nikdy ne hesla. */
  values?: Record<string, string>;
};

export const IDLE: FormState = { status: "idle" };

export function fail(
  message: string,
  errors?: Record<string, string>,
  values?: Record<string, string>
): FormState {
  return { status: "error", message, errors, values };
}

export function ok(message: string): FormState {
  return { status: "ok", message };
}

export function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

/** Heslo se neořezává — mezera na kraji může být jeho součástí. */
export function rawText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export function checkbox(formData: FormData, field: string): boolean {
  return formData.get(field) === "on" || formData.get(field) === "true";
}

const PHONE_RE = /^\+?\d{9,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | undefined {
  if (!value) return "Chybí e-mail.";
  return EMAIL_RE.test(value) ? undefined : "Zkontroluj e-mail, třeba jmeno@email.cz.";
}

/* -------------------------------------------------------------------------- */
/*  Účet                                                                      */
/* -------------------------------------------------------------------------- */

export const PASSWORD_MIN = 8;

/** Nové heslo a jeho zopakování — při registraci i obnově hesla. */
export function validatePassword(password: string, confirm: string): Record<string, string> {
  if (!password) return { password: "Zvol si heslo." };
  if (password.length < PASSWORD_MIN) {
    return { password: `Heslo musí mít aspoň ${PASSWORD_MIN} znaků.` };
  }
  if (password !== confirm) return { passwordConfirm: "Hesla se neshodují." };
  return {};
}

export type AccountValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  consent: boolean;
};

export function readAccount(formData: FormData): AccountValues {
  return {
    name: text(formData, "name"),
    email: text(formData, "email").toLowerCase(),
    phone: text(formData, "phone"),
    password: rawText(formData, "password"),
    passwordConfirm: rawText(formData, "passwordConfirm"),
    consent: checkbox(formData, "consent"),
  };
}

export function validateAccount(values: AccountValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name) errors.name = "Chybí jméno a příjmení.";
  else if (values.name.split(/\s+/).length < 2) errors.name = "Napiš jméno i příjmení.";

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  if (!values.phone) errors.phone = "Chybí telefon.";
  else if (!PHONE_RE.test(values.phone.replace(/[\s-]/g, ""))) {
    errors.phone = "Zkontroluj telefon, třeba +420 777 123 456.";
  }

  Object.assign(errors, validatePassword(values.password, values.passwordConfirm));

  if (!values.consent) errors.consent = "Bez souhlasu účet založit nejde.";

  return errors;
}

/** Jméno a telefon — úprava účtu (bez hesla a souhlasu). */
export function validateProfile(values: { name: string; phone: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "Chybí jméno a příjmení.";
  else if (values.name.split(/\s+/).length < 2) errors.name = "Napiš jméno i příjmení.";
  else if (values.name.length > 120) errors.name = "Nejvýš 120 znaků.";

  if (!values.phone) errors.phone = "Chybí telefon.";
  else if (!PHONE_RE.test(values.phone.replace(/[\s-]/g, ""))) {
    errors.phone = "Zkontroluj telefon, třeba +420 777 123 456.";
  }
  return errors;
}

/** Hodnoty k znovunaplnění formuláře po chybě — hesla se nevrací nikdy. */
export function accountFormValues(values: AccountValues): Record<string, string> {
  return {
    name: values.name,
    email: values.email,
    phone: values.phone,
    consent: values.consent ? "on" : "",
  };
}

/* -------------------------------------------------------------------------- */
/*  Tým                                                                       */
/* -------------------------------------------------------------------------- */

export const NOTE_MAX = 600;

export type TeamValues = {
  name: string;
  city: string;
  foundedYear: string;
  colors: string;
  note: string;
};

export function readTeam(formData: FormData): TeamValues {
  return {
    name: text(formData, "name"),
    city: text(formData, "city"),
    foundedYear: text(formData, "foundedYear"),
    colors: text(formData, "colors"),
    note: text(formData, "note"),
  };
}

/** Rok založení z formuláře (text) pro databázi (číslo nebo nic). */
export function foundedYearValue(values: TeamValues): number | null {
  return values.foundedYear ? Number(values.foundedYear) : null;
}

export function validateTeam(values: TeamValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const thisYear = new Date().getFullYear();

  if (!values.name) errors.name = "Chybí název týmu.";
  else if (values.name.length > 60) errors.name = "Název může mít nejvýš 60 znaků.";

  if (!values.city) errors.city = "Chybí město.";

  if (values.foundedYear) {
    const year = Number(values.foundedYear);
    if (!Number.isInteger(year) || year < 1900 || year > thisYear) {
      errors.foundedYear = `Zadej rok mezi 1900 a ${thisYear}.`;
    }
  }

  if (values.note.length > NOTE_MAX) {
    errors.note = `Poznámka může mít nejvýš ${NOTE_MAX} znaků.`;
  }

  return errors;
}

/** Povinná potvrzení u přihlášky týmu. Klíč = name checkboxu. */
export const REGISTRATION_CONFIRMATIONS = ["confirmRules", "confirmHealth", "confirmAuthority"] as const;

export function validateConfirmations(formData: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of REGISTRATION_CONFIRMATIONS) {
    if (!checkbox(formData, field)) errors[field] = "Bez tohohle potvrzení tým přihlásit nejde.";
  }
  return errors;
}

/** Zaškrtnutá potvrzení pro znovunaplnění formuláře po chybě. */
export function confirmationValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    REGISTRATION_CONFIRMATIONS.map((field) => [field, checkbox(formData, field) ? "on" : ""])
  );
}

/* -------------------------------------------------------------------------- */
/*  Hráč                                                                      */
/* -------------------------------------------------------------------------- */

export type PlayerValues = {
  firstName: string;
  lastName: string;
  number: string;
  position: string;
  birthYear: string;
  captain: boolean;
};

export function readPlayer(formData: FormData): PlayerValues {
  return {
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    number: text(formData, "number"),
    position: text(formData, "position"),
    birthYear: text(formData, "birthYear"),
    captain: checkbox(formData, "captain"),
  };
}

export function validatePlayer(
  values: PlayerValues,
  takenNumbers: number[]
): Record<string, string> {
  const errors: Record<string, string> = {};
  const thisYear = new Date().getFullYear();

  if (!values.firstName) errors.firstName = "Chybí jméno.";
  if (!values.lastName) errors.lastName = "Chybí příjmení.";

  if (values.number) {
    const number = Number(values.number);
    if (!Number.isInteger(number) || number < 1 || number > 99) {
      errors.number = "Číslo dresu musí být 1 až 99.";
    } else if (takenNumbers.includes(number)) {
      errors.number = `Číslo ${number} už má jiný hráč.`;
    }
  }

  if (!POSITIONS.includes(values.position as Position)) {
    errors.position = "Vyber pozici.";
  }

  if (values.birthYear) {
    const year = Number(values.birthYear);
    if (!Number.isInteger(year) || year < 1940 || year > thisYear) {
      errors.birthYear = `Zadej rok mezi 1940 a ${thisYear}.`;
    }
  }

  return errors;
}

/** Hodnoty hráče pro znovunaplnění formuláře po chybě. */
export function playerFormValues(values: PlayerValues): Record<string, string> {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    number: values.number,
    position: values.position,
    birthYear: values.birthYear,
    captain: values.captain ? "on" : "",
  };
}
