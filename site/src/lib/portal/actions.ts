"use server";

import type { AuthError, PostgrestError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formI18n } from "@/i18n/action";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt, plural } from "@/i18n/format";
import { revalidateRoute } from "@/lib/revalidate";
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
import { markNotificationsRead } from "./notifications";
import { PATHS, safeNext } from "./paths";
import { requireRole, requireUser } from "./session";
import { DEFAULT_MAX_ROSTER, type Position } from "./types";
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

// Každý formulář posílá ve skrytém poli jazyk stránky (LocaleField). Podle
// něj akce vrací hlášky a přesměrovává — formI18n(formData).

/* -------------------------------------------------------------------------- */
/*  Pomocníci                                                                 */
/* -------------------------------------------------------------------------- */

type Messages = Dictionary["actions"];

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

/** Odkaz z e-mailu vede přes /auth/confirm (mimo jazyky) na `next` v jazyce stránky. */
function confirmUrl(origin: string, next: string): string {
  return `${origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}

/** Chyby Supabase Auth → hláška pro uživatele. */
function authMessage(error: AuthError, m: Messages): string {
  switch (error.code) {
    case "invalid_credentials":
      return m.authInvalid;
    case "email_not_confirmed":
      return m.authUnconfirmed;
    case "user_already_exists":
    case "email_exists":
      return m.authExists;
    case "weak_password":
      return m.authWeak;
    case "same_password":
      return m.authSame;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return m.authRateLimit;
    case "email_address_invalid":
      return m.authEmailInvalid;
    case "signup_disabled":
      return m.authSignupDisabled;
    case "email_address_not_authorized":
      return m.authEmailFailed;
    default:
      console.error("[auth]", error.code ?? error.status, error.message);
      return m.authUnknown;
  }
}

/** Chyby databáze → hláška, případně chyba u konkrétního pole. */
function dbFailure(
  error: PostgrestError,
  { t, locale }: { t: Dictionary; locale: Locale },
  values?: Record<string, string>
): FormState {
  const m = t.actions;
  const constraint = error.message.match(/constraint "([^"]+)"/)?.[1];
  if (error.code === "23505" && constraint === "players_team_shirt_number_key") {
    return fail(m.checkFields, { number: m.numberTaken }, values);
  }
  if (error.code === "23505" && constraint === "teams_owner_id_key") {
    return fail(m.oneTeam, {}, values);
  }
  if (error.code === "23505" && constraint === "tournament_entries_pkey") {
    return fail(m.alreadyEntered, {}, values);
  }
  if (error.message.includes("registration_closed")) {
    return fail(m.registrationClosed, {}, values);
  }
  // Trigger players_roster_limit: „roster_full:10“ — číslo je limit soupisky.
  const rosterFull = error.message.match(/roster_full:(\d+)/);
  if (rosterFull) {
    const max = Number(rosterFull[1]);
    return fail(fmt(m.rosterFull, { max: plural(locale, max, t.counts.players) }), {}, values);
  }
  if (error.code === "42501") return fail(m.forbidden, {}, values);
  if (error.code === "23514") return fail(m.invalidValue, {}, values);

  console.error("[db]", error.code, error.message);
  return fail(m.saveFailed, {}, values);
}

/** Po změně týmu nebo soupisky překreslí portál i stránku přihlášky ve všech jazycích. */
function refreshTeamViews() {
  revalidateRoute(PATHS.portal, "layout");
  revalidateRoute(PATHS.teamRegistration);
}

/* -------------------------------------------------------------------------- */
/*  Účet                                                                      */
/* -------------------------------------------------------------------------- */

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { t, href } = formI18n(formData);
  if (!isSupabaseConfigured()) return fail(t.common.notConfigured);

  const email = text(formData, "email").toLowerCase();
  const password = rawText(formData, "password");
  const values = { email };

  const errors: Record<string, string> = {};
  const emailError = validateEmail(email, t.validation);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = t.actions.passwordMissing;
  if (Object.keys(errors).length > 0) return fail(t.actions.loginMissing, errors, values);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Nepotvrzený účet: formulář nabídne poslat potvrzovací e-mail znovu.
    const unconfirmed: Record<string, string> =
      error.code === "email_not_confirmed" ? { unconfirmed: "on" } : {};
    return fail(authMessage(error, t.actions), {}, { ...values, ...unconfirmed });
  }

  redirect(href(safeNext(formData.get("next"), PATHS.portal)));
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t, href } = formI18n(formData);
  if (!isSupabaseConfigured()) return fail(t.common.notConfigured);

  const values = readAccount(formData);
  const errors = validateAccount(values, t.validation);
  if (Object.keys(errors).length > 0) {
    return fail(t.actions.checkFields, errors, accountFormValues(values));
  }

  // Nový kapitán ještě nemá tým, takže výchozí další krok je přihláška týmu.
  const next = href(safeNext(formData.get("next"), PATHS.teamRegistration));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      // Profil (jméno, telefon) založí v databázi trigger handle_new_user.
      // Jazyk si pamatují e-mailové šablony (supabase/templates).
      data: { full_name: values.name, phone: values.phone.replace(/[\s-]/g, ""), locale },
      emailRedirectTo: confirmUrl(await siteOrigin(), next),
    },
  });

  if (error) {
    const fieldError: Record<string, string> =
      error.code === "email_address_invalid" ? { email: t.actions.emailUnusable } : {};
    return fail(authMessage(error, t.actions), fieldError, accountFormValues(values));
  }

  // Při zapnutém potvrzování e-mailu Supabase u už registrovaného e-mailu
  // nevrací chybu, ale uživatele bez identit. Tady to prozradit musíme,
  // jinak by kapitán nevěděl, proč mu nepřišel e-mail.
  if (data.user && data.user.identities?.length === 0) {
    return fail(t.actions.authExists, { email: t.actions.emailHasAccount }, accountFormValues(values));
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
  const { t, href } = formI18n(formData);
  if (!isSupabaseConfigured()) return fail(t.common.notConfigured);

  const email = text(formData, "email").toLowerCase();
  if (validateEmail(email, t.validation)) return fail(t.validation.emailMissing);

  const next = href(safeNext(formData.get("next"), PATHS.teamRegistration));
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: confirmUrl(await siteOrigin(), next) },
  });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return fail(authMessage(error, t.actions));
  }
  if (error) console.error("[auth] resend", error.code, error.message);

  return ok(t.actions.resendSent);
}

/** Zapomenuté heslo. Odpověď je stejná, ať účet existuje, nebo ne. */
export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { t, href } = formI18n(formData);
  if (!isSupabaseConfigured()) return fail(t.common.notConfigured);

  const email = text(formData, "email").toLowerCase();
  const emailError = validateEmail(email, t.validation);
  if (emailError) return fail(t.actions.checkEmail, { email: emailError }, { email });

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: confirmUrl(await siteOrigin(), href(PATHS.newPassword)),
  });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return fail(authMessage(error, t.actions), {}, { email });
  }
  if (error) console.error("[auth] reset", error.code, error.message);

  return ok(email);
}

/** Nové heslo — po kliknutí na odkaz z e-mailu, nebo změna hesla v portálu. */
export async function updatePasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { locale, t, href } = formI18n(formData);
  if (!isSupabaseConfigured()) return fail(t.common.notConfigured);
  await requireUser(locale);

  const password = rawText(formData, "password");
  const errors = validatePassword(password, rawText(formData, "passwordConfirm"), t.validation);
  if (Object.keys(errors).length > 0) return fail(t.actions.checkFields, errors);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(authMessage(error, t.actions));

  redirect(`${href(PATHS.portal)}?heslo=zmeneno`);
}

/** Úprava jména a telefonu přihlášeného uživatele (kterékoli role). */
export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  if (!isSupabaseConfigured()) return fail(t.common.notConfigured);
  const user = await requireUser(locale);

  const values = { name: text(formData, "name"), phone: text(formData, "phone") };
  const errors = validateProfile(values, t.validation);
  if (Object.keys(errors).length > 0) return fail(t.actions.checkFields, errors, values);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: values.name, phone: values.phone.replace(/[\s-]/g, "") })
    .eq("id", user.id)
    .select("id");
  if (error) return dbFailure(error, { t, locale }, values);
  if (data.length === 0) return fail(t.actions.accountSaveFailed, {}, values);

  refreshTeamViews();
  return ok(t.actions.profileSaved);
}

/**
 * Označí oznámení jako přečtená — jedno konkrétní (pole id), nebo všechna.
 * Odznaky v navigaci se tím vynulují.
 */
export async function markNotificationsReadAction(formData: FormData): Promise<void> {
  const { locale } = formI18n(formData);
  const user = await requireUser(locale);
  const ids = formData.getAll("id").filter((v): v is string => typeof v === "string" && v.length > 0);
  await markNotificationsRead(user.id, ids.length ? ids : undefined);
  revalidateRoute(PATHS.portal, "layout");
}

export async function logoutAction(formData: FormData): Promise<void> {
  const { href } = formI18n(formData);
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect(href("/"));
}

/* -------------------------------------------------------------------------- */
/*  Tým                                                                       */
/* -------------------------------------------------------------------------- */

/** Přihláška nového týmu na otevřený turnaj. Projde jen kapitánovi bez týmu. */
export async function registerTeamAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { locale, t, href } = formI18n(formData);
  const user = await requireRole("captain", locale);

  const values = readTeam(formData);
  const formValues = { ...values, ...confirmationValues(formData) };
  const errors = { ...validateTeam(values, t.validation), ...validateConfirmations(formData, t.validation) };
  if (Object.keys(errors).length > 0) return fail(t.actions.checkFields, errors, formValues);

  // Druhé odeslání (dvojklik, zpět v prohlížeči) tým nezaloží podruhé.
  if (await getCaptainTeam(user.id)) redirect(href(PATHS.teamRegistration));

  const { error } = await registerTeam({ ...values, foundedYear: foundedYearValue(values) });
  if (error) return dbFailure(error, { t, locale }, formValues);

  refreshTeamViews();
  redirect(href(PATHS.teamRegistration));
}

/** Přihláška už existujícího týmu na další turnaj. */
export async function enterTournamentAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { locale, t, href } = formI18n(formData);
  const user = await requireRole("captain", locale);

  const errors = validateConfirmations(formData, t.validation);
  if (Object.keys(errors).length > 0) {
    return fail(t.actions.checkConfirmations, errors, confirmationValues(formData));
  }

  const [team, tournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);
  if (!team) redirect(href(PATHS.teamRegistration));
  if (!tournament) return fail(t.actions.registrationClosed);

  const { error } = await enterTournament(team.id, tournament.id);
  if (error) return dbFailure(error, { t, locale }, confirmationValues(formData));

  refreshTeamViews();
  redirect(href(PATHS.teamRegistration));
}

// Tým spravuje jeho vlastník (teams.owner_id) — kapitán, ale i organizátor, který
// má vlastní tým. Nový tým a přihláška na turnaj zůstávají jen kapitánům.

/** Odhlášení týmu z turnaje, na který se právě přihlašuje. */
export async function withdrawTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t, href } = formI18n(formData);
  const user = await requireUser(locale);

  const [team, tournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);
  if (!team) redirect(href(PATHS.teamRegistration));
  // Formulář nese turnaj, který měl kapitán na obrazovce. Kdyby mezitím
  // organizátor otevřel přihlášky jinde, neodhlásíme ho z něčeho jiného.
  if (!tournament || tournament.id !== text(formData, "tournamentId")) {
    return fail(t.actions.withdrawClosed);
  }

  const { error, removed } = await withdrawEntry(team.id, tournament.id);
  if (error) return dbFailure(error, { t, locale });
  if (!removed) return fail(t.actions.withdrawHasMatches);

  refreshTeamViews();
  redirect(href(PATHS.teamRegistration));
}

/** Úprava údajů týmu. */
export async function saveTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t, href } = formI18n(formData);
  const user = await requireUser(locale);
  const team = await getCaptainTeam(user.id);
  if (!team) redirect(href(PATHS.teamRegistration));

  const values = readTeam(formData);
  const errors = validateTeam(values, t.validation);
  if (Object.keys(errors).length > 0) return fail(t.actions.checkFields, errors, values);

  const { error } = await updateTeam(team.id, { ...values, foundedYear: foundedYearValue(values) });
  if (error) return dbFailure(error, { t, locale }, values);

  refreshTeamViews();
  return ok(t.actions.teamSaved);
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
  const { locale, t } = formI18n(formData);
  const user = await requireUser(locale);
  const [team, tournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);
  if (!team) return fail(t.actions.registerTeamFirst);

  const values = readPlayer(formData);

  // Největší soupiska podle turnaje s otevřenými přihláškami (Winter Clutch: 10).
  // Stejný limit hlídá i databáze, tohle je kvůli srozumitelné hlášce.
  const maxRoster = tournament?.maxRoster ?? DEFAULT_MAX_ROSTER;
  if (team.players.length >= maxRoster) {
    return fail(
      fmt(t.actions.rosterFull, { max: plural(locale, maxRoster, t.counts.players) }),
      {},
      playerFormValues(values)
    );
  }

  const errors = validatePlayer(values, takenNumbers(team.players), t.validation);
  if (Object.keys(errors).length > 0) {
    return fail(t.actions.checkFields, errors, playerFormValues(values));
  }

  const { error } = await addPlayer(team.id, toPlayerInput(values));
  if (error) return dbFailure(error, { t, locale }, playerFormValues(values));

  refreshTeamViews();
  return ok(fmt(t.actions.playerAdded, { name: `${values.firstName} ${values.lastName}` }));
}

export async function updatePlayerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const user = await requireUser(locale);
  const team = await getCaptainTeam(user.id);
  if (!team) return fail(t.actions.registerTeamFirst);

  const playerId = text(formData, "playerId");
  if (!team.players.some((p) => p.id === playerId)) return fail(t.actions.playerMissing);

  const values = readPlayer(formData);
  const errors = validatePlayer(values, takenNumbers(team.players, playerId), t.validation);
  if (Object.keys(errors).length > 0) {
    return fail(t.actions.checkFields, errors, playerFormValues(values));
  }

  const { error } = await updatePlayer(team.id, playerId, toPlayerInput(values));
  if (error) return dbFailure(error, { t, locale }, playerFormValues(values));

  refreshTeamViews();
  return ok(t.actions.playerUpdated);
}

export async function removePlayerAction(formData: FormData): Promise<void> {
  const { locale } = formI18n(formData);
  const user = await requireUser(locale);
  const team = await getCaptainTeam(user.id);
  if (!team) return;

  const { error } = await removePlayer(team.id, text(formData, "playerId"));
  if (error) console.error("[db] remove player", error.code, error.message);
  refreshTeamViews();
}
