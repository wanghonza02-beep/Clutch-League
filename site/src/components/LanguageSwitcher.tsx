"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_NAMES,
  LOCALE_SHORT,
  localePath,
  splitLocale,
  type Locale,
} from "@/i18n/config";

/** Zapamatuje si volbu — proxy pak návštěvníka pošle rovnou do jeho jazyka. */
function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Přepínač jazyků v liště. Vede na stejnou stránku v jiném jazyce
 * (/turnaje → /en/turnaje), parametry adresy zůstávají.
 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useT();
  const pathname = usePathname();
  // Menu je otevřené pro konkrétní stránku — po přechodu jinam se samo zavře.
  // Parametry adresy (?next=…) se čtou při otevření; useSearchParams by z celé
  // navigace v layoutu udělal klientské vykreslování.
  const [menu, setMenu] = useState<{ pathname: string; search: string } | null>(null);
  const open = menu?.pathname === pathname;
  const close = () => setMenu(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { path } = splitLocale(pathname);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(null);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="cl-lang" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="cl-lang__btn"
        aria-expanded={open}
        aria-controls="cl-lang-menu"
        aria-label={`${t.lang.switchTo}: ${LOCALE_NAMES[locale]}`}
        onClick={() => setMenu(open ? null : { pathname, search: window.location.search })}
      >
        <Globe size={16} strokeWidth={2} aria-hidden />
        <span>{LOCALE_SHORT[locale]}</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden className="cl-lang__chev" />
      </button>

      {open && (
        <ul id="cl-lang-menu" className="cl-lang__menu" aria-label={t.lang.label}>
          {LOCALES.map((l) => (
            <li key={l}>
              <a
                href={`${localePath(l, path)}${menu.search}`}
                hrefLang={l}
                lang={l}
                className="cl-lang__item"
                aria-current={l === locale ? "true" : undefined}
                onClick={() => {
                  rememberLocale(l);
                  close();
                }}
              >
                <span>{LOCALE_NAMES[l]}</span>
                <span className="cl-lang__code">
                  {l === locale && <Check size={14} strokeWidth={2.5} aria-hidden />}
                  {LOCALE_SHORT[l]}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
