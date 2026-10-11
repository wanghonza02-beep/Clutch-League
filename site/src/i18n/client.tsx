"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localePath, type Locale } from "./config";
import type { ClientDictionary } from "./dictionaries";

// Jazyk a část slovníku pro komponenty v prohlížeči. Poskytovatel je
// v kořenovém layoutu (app/[lang]/layout.tsx).

type I18n = { locale: Locale; t: ClientDictionary };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: ClientDictionary;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("Komponenta s překlady musí být uvnitř <I18nProvider>.");
  return ctx;
}

export const useLocale = (): Locale => useI18n().locale;

export const useT = (): ClientDictionary => useI18n().t;

/** Úvodní stránka v aktuálním jazyce: "/" nebo "/en". */
export function useHomePath(): string {
  return localePath(useLocale(), "/");
}
