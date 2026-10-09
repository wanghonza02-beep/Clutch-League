"use server";

import type { AuthError, PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  addPlayer,
  enterTournament,
  getCaptainTeam,
  getOpenTournament,
  registerTeam,
  removePlayer,
  updatePlayer,
  updateTeam,
  withdrawEntry,
  type PlayerInput,
} from "./data";
import { PATHS, safeNext } from "./paths";
import { requireRole, requireUser } from "./session";
import type { Position } from "./types";
import {
  accountFormValues,
  confirmationValues,
  fail,
  foundedYearValue,
  ok,
  playerFormValues,
  rawText,
  readAccount,
  readPlayer,
  readTeam,
  text,
  validateAccount,
  validateConfirmations,
  validateEmail,
  validatePassword,
  validatePlayer,
  validateProfile,
  validateTeam,
  type FormState,
  type PlayerValues,
} from "./validation";

/* -------------------------------------------------------------------------- */
/*  Pomocníci                                                                 */
/* -------------------------------------------------------------------------- */

const NOT_CONFIGURED = fail(
  "Databáze ještě není připojená. Doplň klíče Supabase do souboru .env.local (viz supabase/README.md)."
);

/**
 * Adresa webu pro odkazy v e-mailech (potvrzení účtu, nové heslo). Supabase
 * odkaz pustí jen na adresy z Authentication → URL Configuration.
 */
async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : "http://localhost:3000";
}

function confirmUrl(origin: string, next: string): string {
  return `${origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}

/** Chyby Supabase Auth → česká hláška pro uživatele. */
function authMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Přihlášení se nepovedlo. Zkontroluj e-mail a heslo.";
    case "email_not_confirmed":
      return "Účet ještě není potvrzený. Klikni na odkaz v e-mailu, který jsme ti poslali.";
    case "user_already_exists":
    case "email_exists":
      return "Účet s tímhle e-mailem už existuje. Přihlas se, nebo si obnov heslo.";
    case "weak_password":
      return "Heslo je moc slabé. Zkus delší, třeba s číslem nebo znakem.";
    case "same_password":
      return "Nové heslo musí být jiné než to současné.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Moc pokusů za sebou. Zkus to prosím za pár minut.";
    case "email_address_invalid":
      return "Tenhle e-mail nejde použít. Zkontroluj ho.";
    case "signup_disabled":
      return "Registrace je teď vypnutá. Napiš nám, prosím.";
    case "email_address_not_authorized":
      return "Potvrzovací e-mail se nepodařilo odeslat. Zkus to později, nebo nám napiš.";
    default:
      console.error("[auth]", error.code ?? error.status, error.message);
      return "Něco se pokazilo. Zkus to prosím znovu.";
  }
}

/** Chyby databáze → česká hláška, případně chyba u konkrétního pole. */
function dbFailure(error: PostgrestError, values?: Record<string, string>): FormState {
  const constraint = error.message.match(/constraint "([^"]+)"/)?.[1];
  if (error.code === "23505" && constraint === "players_team_shirt_number_key") {
    return fail("Zkontroluj zvýrazněná pole.", { number: "Tohle číslo už má jiný hráč." }, values);
  }
  if (error.code === "23505" && constraint === "teams_owner_id_key") {
    return fail("Už máš přihlášený tým — jeden kapitán spravuje jeden tým.", {}, values);
  }
  if (error.code === "23505" && constraint === "tournament_entries_pkey") {
    return fail("Tým už je na tenhle turnaj přihlášený.", {}, values);
  }
  if (error.message.includes("registration_closed")) {
    return fail("Přihlášky na turnaj jsou teď zavřené.", {}, values);
  }
  if (error.code === "42501") return fail("Na tohle nemáš oprávnění.", {}, values);
  if (error.code === "23514") return fail("Některý údaj má neplatnou hodnotu.", {}, values);

  console.error("[db]", error.code, error.message);
  return fail("Uložení se nepovedlo. Zkus to prosím znovu.", {}, values);
}

/** Po změně týmu nebo soupisky překreslí portál i stránku přihlášky. */
function refreshTeamViews() {
  revalidatePath(PATHS.portal, "layout");
  revalidatePath(PATHS.teamRegistration);
}

/* -------------------------------------------------------------------------- */
/*  Účet                                                                      */
/* -------------------------------------------------------------------------- */

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = text(formData, "email").toLowerCase();
  const password = rawText(formData, "password");
  const values = { email };

  const errors: Record<string, string> = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = "Zadej heslo.";
  if (Object.keys(errors).length > 0) return fail("Vyplň e-mail i heslo.", errors, values);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Nepotvrzený účet: formulář nabídne poslat potvrzovací e-mail znovu.
    const unconfirmed: Record<string, string> =
      error.code === "email_not_confirmed" ? { unconfirmed: "on" } : {};
    return fail(authMessage(error), {}, { ...values, ...unconfirmed });
  }

  redirect(safeNext(formData.get("next"), PATHS.portal));
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const values = readAccount(formData);
  const errors = validateAccount(values);
  if (Object.keys(errors).length > 0) {
    return fail("Zkontroluj zvýrazněná pole.", errors, accountFormValues(values));
  }

  // Nový kapitán ještě nemá tým, takže výchozí další krok je přihláška týmu.
  const next = safeNext(formData.get("next"), PATHS.teamRegistration);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      // Profil (jméno, telefon) založí v databázi trigger handle_new_user.
      data: { full_name: values.name, phone: values.phone.replace(/[\s-]/g, "") },
      emailRedirectTo: confirmUrl(await siteOrigin(), next),
    },
  });

  if (error) {
    const fieldError: Record<string, string> =
      error.code === "email_address_invalid" ? { email: "Tenhle e-mail nejde použít." } : {};
    return fail(authMessage(error), fieldError, accountFormValues(values));
  }

  // Při zapnutém potvrzování e-mailu Supabase u už registrovaného e-mailu
  // nevrací chybu, ale uživatele bez identit. Tady to prozradit musíme,
  // jinak by kapitán nevěděl, proč mu nepřišel e-mail.
  if (data.user && data.user.identities?.length === 0) {
    return fail(
      "Účet s tímhle e-mailem už existuje. Přihlas se, nebo si obnov heslo.",
      { email: "Tenhle e-mail už má účet." },
      accountFormValues(values)
    );
  }

  // Potvrzování e-mailu vypnuté → Supabase rovnou přihlásí.
  if (data.session) redirect(next);

  return {
    status: "ok",
    message: values.email,
    values: { email: values.email, next },
  };
}

/** Znovu pošle potvrzovací e-mail. Odpověď je stejná, ať účet existuje, nebo ne. */
export async function resendConfirmationAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = text(formData, "email").toLowerCase();
  if (validateEmail(email)) return fail("Chybí e-mail.");

  const next = safeNext(formData.get("next"), PATHS.teamRegistration);
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: confirmUrl(await siteOrigin(), next) },
  });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return fail(authMessage(error));
  }
  if (error) console.error("[auth] resend", error.code, error.message);

  return ok("Pokud účet čeká na potvrzení, poslali jsme odkaz znovu. Mrkni i do spamu.");
}

/** Zapomenuté heslo. Odpověď je stejná, ať účet existuje, nebo ne. */
export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = text(formData, "email").toLowerCase();
  const emailError = validateEmail(email);
  if (emailError) return fail("Zkontroluj e-mail.", { email: emailError }, { email });

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: confirmUrl(await siteOrigin(), PATHS.newPassword),
  });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return fail(authMessage(error), {}, { email });
  }
  if (error) console.error("[auth] reset", error.code, error.message);

  return ok(email);
}

/** Nové heslo — po kliknutí na odkaz z e-mailu, nebo změna hesla v portálu. */
export async function updatePasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  await requireUser();

  const password = rawText(formData, "password");
  const errors = validatePassword(password, rawText(formData, "passwordConfirm"));
  if (Object.keys(errors).length > 0) return fail("Zkontroluj zvýrazněná pole.", errors);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(authMessage(error));

  redirect(`${PATHS.portal}?heslo=zmeneno`);
}

/** Úprava jména a telefonu přihlášeného uživatele (kterékoli role). */
export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const user = await requireUser();

  const values = { name: text(formData, "name"), phone: text(formData, "phone") };
  const errors = validateProfile(values);
  if (Object.keys(errors).length > 0) return fail("Zkontroluj zvýrazněná pole.", errors, values);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: values.name, phone: values.phone.replace(/[\s-]/g, "") })
    .eq("id", user.id)
    .select("id");
  if (error) return dbFailure(error, values);
  if (data.length === 0) return fail("Účet se nepodařilo uložit.", {}, values);

  refreshTeamViews();
  return ok("Údaje jsou uložené.");
}

export async function logoutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

/* -------------------------------------------------------------------------- */
/*  Tým                                                                       */
/* -------------------------------------------------------------------------- */

/** Přihláška nového týmu na otevřený turnaj. Projde jen kapitánovi bez týmu. */
export async function registerTeamAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireRole("captain");

  const values = readTeam(formData);
  const formValues = { ...values, ...confirmationValues(formData) };
  const errors = { ...validateTeam(values), ...validateConfirmations(formData) };
  if (Object.keys(errors).length > 0) return fail("Zkontroluj zvýrazněná pole.", errors, formValues);

  // Druhé odeslání (dvojklik, zpět v prohlížeči) tým nezaloží podruhé.
  if (await getCaptainTeam(user.id)) redirect(PATHS.teamRegistration);

  const { error } = await registerTeam({ ...values, foundedYear: foundedYearValue(values) });
  if (error) return dbFailure(error, formValues);

  refreshTeamViews();
  redirect(PATHS.teamRegistration);
}

/** Přihláška už existujícího týmu na další turnaj. */
export async function enterTournamentAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireRole("captain");

  const errors = validateConfirmations(formData);
  if (Object.keys(errors).length > 0) {
    return fail("Zkontroluj potvrzení.", errors, confirmationValues(formData));
  }

  const [team, tournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);
  if (!team) redirect(PATHS.teamRegistration);
  if (!tournament) return fail("Přihlášky na turnaj jsou teď zavřené.");

  const { error } = await enterTournament(team.id, tournament.id);
  if (error) return dbFailure(error, confirmationValues(formData));

  refreshTeamViews();
  redirect(PATHS.teamRegistration);
}

/** Odhlášení týmu z turnaje, na který se právě přihlašuje. */
export async function withdrawTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("captain");

  const [team, tournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);
  if (!team) redirect(PATHS.teamRegistration);
  // Formulář nese turnaj, který měl kapitán na obrazovce. Kdyby mezitím
  // organizátor otevřel přihlášky jinde, neodhlásíme ho z něčeho jiného.
  if (!tournament || tournament.id !== text(formData, "tournamentId")) {
    return fail("Přihlášky jsou už zavřené. Odhlášení týmu vyřeš s organizátorem přes Kontakt.");
  }

  const { error, removed } = await withdrawEntry(team.id, tournament.id);
  if (error) return dbFailure(error);
  if (!removed) {
    return fail(
      "Tým už má naplánované zápasy, takže ho odhlásit nejde. Napiš organizátorovi přes Kontakt."
    );
  }

  refreshTeamViews();
  redirect(PATHS.teamRegistration);
}

/** Úprava údajů týmu. */
export async function saveTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("captain");
  const team = await getCaptainTeam(user.id);
  if (!team) redirect(PATHS.teamRegistration);

  const values = readTeam(formData);
  const errors = validateTeam(values);
  if (Object.keys(errors).length > 0) return fail("Zkontroluj zvýrazněná pole.", errors, values);

  const { error } = await updateTeam(team.id, { ...values, foundedYear: foundedYearValue(values) });
  if (error) return dbFailure(error, values);

  refreshTeamViews();
  return ok("Údaje týmu jsou uložené.");
}

/* -------------------------------------------------------------------------- */
/*  Hráči                                                                     */
/* -------------------------------------------------------------------------- */

function toPlayerInput(values: PlayerValues): PlayerInput {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    number: values.number ? Number(values.number) : null,
    position: values.position as Position,
    birthYear: values.birthYear ? Number(values.birthYear) : null,
    captain: values.captain,
  };
}

function takenNumbers(players: { id: string; number: number | null }[], exceptId?: string): number[] {
  return players.filter((p) => p.id !== exceptId && p.number !== null).map((p) => p.number as number);
}

export async function addPlayerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("captain");
  const team = await getCaptainTeam(user.id);
  if (!team) return fail("Nejdřív přihlas tým.");

  const values = readPlayer(formData);
  const errors = validatePlayer(values, takenNumbers(team.players));
  if (Object.keys(errors).length > 0) {
    return fail("Zkontroluj zvýrazněná pole.", errors, playerFormValues(values));
  }

  const { error } = await addPlayer(team.id, toPlayerInput(values));
  if (error) return dbFailure(error, playerFormValues(values));

  refreshTeamViews();
  return ok(`${values.firstName} ${values.lastName} je na soupisce.`);
}

export async function updatePlayerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireRole("captain");
  const team = await getCaptainTeam(user.id);
  if (!team) return fail("Nejdřív přihlas tým.");

  const playerId = text(formData, "playerId");
  if (!team.players.some((p) => p.id === playerId)) return fail("Hráč na soupisce není.");

  const values = readPlayer(formData);
  const errors = validatePlayer(values, takenNumbers(team.players, playerId));
  if (Object.keys(errors).length > 0) {
    return fail("Zkontroluj zvýrazněná pole.", errors, playerFormValues(values));
  }

  const { error } = await updatePlayer(team.id, playerId, toPlayerInput(values));
  if (error) return dbFailure(error, playerFormValues(values));

  refreshTeamViews();
  return ok("Hráč je upravený.");
}

export async function removePlayerAction(formData: FormData): Promise<void> {
  const user = await requireRole("captain");
  const team = await getCaptainTeam(user.id);
  if (!team) return;

  const { error } = await removePlayer(team.id, text(formData, "playerId"));
  if (error) console.error("[db] remove player", error.code, error.message);
  refreshTeamViews();
}

