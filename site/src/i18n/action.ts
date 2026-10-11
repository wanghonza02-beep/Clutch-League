import { LOCALE_FIELD, localePath, toLocale, type Locale } from "./config";
import { getDictionaryFor, type Dictionary } from "./dictionaries";

// Jazyk v server akcích. Root-params tu nefungují, proto ho každý formulář
// posílá ve skrytém poli (LocaleField, ActionForm ho přidává sám).

export function formLocale(formData: FormData): Locale {
  return toLocale(formData.get(LOCALE_FIELD));
}

export function formI18n(formData: FormData): {
  locale: Locale;
  t: Dictionary;
  /** Cesta v jazyce formuláře, pro redirect(). */
  href: (path: string) => string;
} {
  const locale = formLocale(formData);
  return { locale, t: getDictionaryFor(locale), href: (path) => localePath(locale, path) };
}
