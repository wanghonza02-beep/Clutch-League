import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { POSITIONS, type Position } from "./types";

/** Hlášky kontrol ve zvoleném jazyce (slovník, část validation). */
export type ValidationMessages = Dictionary["validation"];

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

export function validateEmail(value: string, v: ValidationMessages): string | undefined {
  if (!value) return v.emailMissing;
  return EMAIL_RE.test(value) ? undefined : v.emailInvalid;
}

/* -------------------------------------------------------------------------- */
/*  Účet                                                                      */
/* -------------------------------------------------------------------------- */

export const PASSWORD_MIN = 8;

/** Nové heslo a jeho zopakování — při registraci i obnově hesla. */
export function validatePassword(
  password: string,
  confirm: string,
  v: ValidationMessages
): Record<string, string> {
  if (!password) return { password: v.passwordMissing };
  if (password.length < PASSWORD_MIN) {
    return { password: fmt(v.passwordShort, { n: PASSWORD_MIN }) };
  }
  if (password !== confirm) return { passwordConfirm: v.passwordMismatch };
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

function validateName(name: string, v: ValidationMessages): string | undefined {
  if (!name) return v.nameMissing;
  if (name.split(/\s+/).length < 2) return v.nameIncomplete;
  if (name.length > 120) return v.max120;
  return undefined;
}

function validatePhone(phone: string, v: ValidationMessages): string | undefined {
  if (!phone) return v.phoneMissing;
  if (!PHONE_RE.test(phone.replace(/[\s-]/g, ""))) return v.phoneInvalid;
  return undefined;
}

export function validateAccount(values: AccountValues, v: ValidationMessages): Record<string, string> {
  const errors: Record<string, string> = {};

  const nameError = validateName(values.name, v);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(values.email, v);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhone(values.phone, v);
  if (phoneError) errors.phone = phoneError;

  Object.assign(errors, validatePassword(values.password, values.passwordConfirm, v));

  if (!values.consent) errors.consent = v.consentMissing;

  return errors;
}

/** Jméno a telefon — úprava účtu (bez hesla a souhlasu). */
export function validateProfile(
  values: { name: string; phone: string },
  v: ValidationMessages
): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameError = validateName(values.name, v);
  if (nameError) errors.name = nameError;
  const phoneError = validatePhone(values.phone, v);
  if (phoneError) errors.phone = phoneError;
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

export function validateTeam(values: TeamValues, v: ValidationMessages): Record<string, string> {
  const errors: Record<string, string> = {};
  const thisYear = new Date().getFullYear();

  if (!values.name) errors.name = v.teamNameMissing;
  else if (values.name.length > 60) errors.name = v.teamNameLong;

  // Město je nepovinné, barvy týmu povinné.
  if (values.city.length > 60) errors.city = v.max60;

  if (!values.colors) errors.colors = v.colorsMissing;
  else if (values.colors.length > 60) errors.colors = v.max60;

  if (values.foundedYear) {
    const year = Number(values.foundedYear);
    if (!Number.isInteger(year) || year < 1900 || year > thisYear) {
      errors.foundedYear = fmt(v.yearRange, { from: 1900, to: thisYear });
    }
  }

  if (values.note.length > NOTE_MAX) {
    errors.note = fmt(v.noteLong, { n: NOTE_MAX });
  }

  return errors;
}

/** Povinná potvrzení u přihlášky týmu. Klíč = name checkboxu. */
export const REGISTRATION_CONFIRMATIONS = ["confirmRules", "confirmHealth", "confirmAuthority"] as const;

export function validateConfirmations(formData: FormData, v: ValidationMessages): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of REGISTRATION_CONFIRMATIONS) {
    if (!checkbox(formData, field)) errors[field] = v.confirmationMissing;
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
  takenNumbers: number[],
  v: ValidationMessages
): Record<string, string> {
  const errors: Record<string, string> = {};
  const thisYear = new Date().getFullYear();

  if (!values.firstName) errors.firstName = v.firstNameMissing;
  if (!values.lastName) errors.lastName = v.lastNameMissing;

  if (values.number) {
    const number = Number(values.number);
    if (!Number.isInteger(number) || number < 1 || number > 99) {
      errors.number = v.numberRange;
    } else if (takenNumbers.includes(number)) {
      errors.number = fmt(v.numberTaken, { n: number });
    }
  }

  if (!POSITIONS.includes(values.position as Position)) {
    errors.position = v.positionMissing;
  }

  // Rok narození je povinný, číslo dresu ne.
  if (!values.birthYear) {
    errors.birthYear = v.birthYearMissing;
  } else {
    const year = Number(values.birthYear);
    if (!Number.isInteger(year) || year < 1940 || year > thisYear) {
      errors.birthYear = fmt(v.yearRange, { from: 1940, to: thisYear });
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
