// Jazyky webu. Čeština je výchozí a má adresy bez předpony (/turnaje),
// ostatní jazyky mají předponu (/en/turnaje, /uk/turnaje, /sk/turnaje).
// Čisté funkce bez serverových importů — používá je proxy, server i prohlížeč.

export const LOCALES = ["cs", "en", "uk", "sk"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "cs";

/** Cookie s jazykem, který si návštěvník sám vybral přepínačem. */
export const LOCALE_COOKIE = "cl-lang";

/** Skryté pole formulářů s jazykem stránky (server akce podle něj odpovídají). */
export const LOCALE_FIELD = "_locale";

/** Název jazyka v přepínači — vždy v daném jazyce, ať ho každý najde. */
export const LOCALE_NAMES: Record<Locale, string> = {
  cs: "Čeština",
  en: "English",
  uk: "Українська",
  sk: "Slovenčina",
};

/** Krátké označení na tlačítku přepínače (UA je pro Ukrajince srozumitelnější než UK). */
export const LOCALE_SHORT: Record<Locale, string> = {
  cs: "CZ",
  en: "EN",
  uk: "UA",
  sk: "SK",
};

/** Locale pro Intl (data, čísla, řazení). */
export const INTL_LOCALE: Record<Locale, string> = {
  cs: "cs-CZ",
  en: "en-GB",
  uk: "uk-UA",
  sk: "sk-SK",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Jazyk z hodnoty formuláře, cookie apod. Cokoli neznámého = čeština. */
export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Rozdělí cestu na jazyk a cestu bez předpony:
 * "/en/turnaje" → { locale: "en", path: "/turnaje" }, "/turnaje" → { locale: "cs", path: "/turnaje" }.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const match = pathname.match(/^\/([a-z]{2})(?=\/|$|\?|#)(.*)$/);
  if (match && isLocale(match[1])) {
    const rest = match[2];
    return { locale: match[1], path: rest.startsWith("/") ? rest : `/${rest}` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/**
 * Interní cesta v daném jazyce: localePath("en", "/turnaje") → "/en/turnaje".
 * Cesta smí už předponu mít (z ?next=), nahradí se.
 */
export function localePath(locale: Locale, path: string): string {
  const { path: bare } = splitLocale(path.startsWith("/") ? path : `/${path}`);
  if (locale === DEFAULT_LOCALE) return bare;
  if (bare === "/") return `/${locale}`;
  if (bare.startsWith("/?") || bare.startsWith("/#")) return `/${locale}${bare.slice(1)}`;
  return `/${locale}${bare}`;
}
