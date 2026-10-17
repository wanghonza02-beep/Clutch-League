import { INTL_LOCALE, type Locale } from "./config";

// Pomocníci pro texty ze slovníků. Slovníky obsahují jen řetězce (a objekty
// řetězců), aby šly poslat i do komponent v prohlížeči. Hodnoty se dosazují
// přes {klíč}: fmt("Ahoj {name}", { name: "Petr" }) → "Ahoj Petr".

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/**
 * Tvary podle počtu. Kategorie jsou z Intl.PluralRules: čeština a slovenština
 * používají one / few / other, ukrajinština one / few / many, angličtina one / other.
 * Chybějící kategorie spadne na `other`. {n} se nahradí počtem.
 */
export type PluralForms = { one: string; few?: string; many?: string; other: string };

/** Jen pro typ ve slovníku: pl({ one: "{n} hráč", few: "{n} hráči", other: "{n} hráčů" }). */
export const pl = (forms: PluralForms): PluralForms => forms;

const rules = new Map<Locale, Intl.PluralRules>();

export function plural(locale: Locale, count: number, forms: PluralForms): string {
  let rule = rules.get(locale);
  if (!rule) {
    rule = new Intl.PluralRules(INTL_LOCALE[locale]);
    rules.set(locale, rule);
  }
  const category = rule.select(count) as keyof PluralForms;
  return fmt(forms[category] ?? forms.other, { n: count });
}

/** Desetinné číslo s čárkou nebo tečkou podle jazyka: 2.5 → "2,5" / "2.5". */
export function formatDecimal(locale: Locale, value: number, digits = 1): string {
  return value.toLocaleString(INTL_LOCALE[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Celé koruny podle jazyka: „2 700 Kč“, „CZK 2,700“. Šablona je ve slovníku (common.money). */
export function formatMoney(locale: Locale, amount: number, template: string): string {
  return fmt(template, { amount: formatDecimal(locale, amount, 0) });
}
