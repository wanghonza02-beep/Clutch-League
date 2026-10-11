"use client";

import { LOCALE_FIELD } from "./config";
import { useLocale } from "./client";

/** Skryté pole s jazykem stránky. Server akce podle něj vrací hlášky a přesměrování. */
export default function LocaleField() {
  return <input type="hidden" name={LOCALE_FIELD} value={useLocale()} />;
}
