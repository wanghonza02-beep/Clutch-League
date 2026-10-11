import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isLocale, localePath, type Locale } from "./config";
import { fmt } from "./format";
import { getDictionaryFor, type Dictionary } from "./dictionaries";

// Jazyk a slovník pro serverové komponenty a stránky. Jazyk je kořenový
// parametr [lang] (app/[lang]/layout.tsx), takže se nemusí předávat dolů.
// V server akcích root-params nefungují — tam se jazyk čte z formuláře
// (i18n/action.ts).

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return getDictionaryFor(await getLocale());
}

/** Jazyk i slovník najednou — nejčastější případ ve stránkách. */
export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDictionaryFor(locale) };
}

/** Cesta v aktuálním jazyce (pro redirect ve stránkách). */
export async function localeHref(path: string): Promise<string> {
  return localePath(await getLocale(), path);
}

/** Titulek stránky: „Kontakt | Clutch League“. */
export function pageTitle(t: Dictionary, title: string): string {
  return fmt(t.meta.title, { title });
}

/** Titulek stránky portálu: „Hráči | Portál Clutch League“. */
export function portalTitle(t: Dictionary, title: string): string {
  return fmt(t.meta.portalTitle, { title });
}
