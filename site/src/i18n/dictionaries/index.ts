import type { Locale } from "../config";
import cs, { type Dictionary } from "./cs";
import en from "./en";
import sk from "./sk";
import uk from "./uk";

// Jen pro server (stránky, akce). Komponenty v prohlížeči dostanou přes
// I18nProvider jen část slovníku — viz CLIENT_NAMESPACES.

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { cs, en, uk, sk };

export function getDictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Části slovníku, které potřebují komponenty v prohlížeči ("use client"). */
export const CLIENT_NAMESPACES = [
  "common",
  "lang",
  "counts",
  "labels",
  "nav",
  "teamButton",
  "gallery",
  "archiveError",
  "portalNav",
  "authForms",
  "teamForms",
  "matchForm",
] as const satisfies readonly (keyof Dictionary)[];

export type ClientDictionary = Pick<Dictionary, (typeof CLIENT_NAMESPACES)[number]>;

export function clientDictionary(dict: Dictionary): ClientDictionary {
  return Object.fromEntries(CLIENT_NAMESPACES.map((key) => [key, dict[key]])) as ClientDictionary;
}
