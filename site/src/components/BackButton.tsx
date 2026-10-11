"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { localePath, splitLocale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { previousPaths } from "@/lib/navHistory";
import { PATHS } from "@/lib/portal/paths";
import { useTransitionNavigate } from "@/components/PageTransition";

/** Stránky, které přihlášeného hned přesměrují dál — zpět na ně nemá smysl. */
const SIGNED_OUT_ONLY: string[] = [PATHS.login, PATHS.signup];

async function isSignedIn(): Promise<boolean> {
  try {
    const res = await fetch("/api/session", { cache: "no-store" });
    const data: { role: string | null } = await res.json();
    return Boolean(data.role);
  } catch {
    return false;
  }
}

/**
 * „Zpět“ na předchozí stránku webu. Bez historie na webu (příchod přes adresu
 * nebo odkaz z e-mailu) vede na `fallback` (výchozí úvodní stránka).
 *
 * Po přihlášení je v historii přihlašovací stránka; ta by přihlášeného hned
 * poslala zpátky, kde je — tlačítko ji proto přeskočí a vede o krok dál.
 */
export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  const navigate = useTransitionNavigate();
  const locale = useLocale();
  const t = useT();
  const fallbackHref = localePath(locale, fallback);

  const goBack = async () => {
    const previous = previousPaths();
    if (previous.length === 0) {
      router.push(fallbackHref);
      return;
    }
    const isSignedOutOnly = (path: string) => SIGNED_OUT_ONLY.includes(splitLocale(path).path);
    if (isSignedOutOnly(previous[0]) && (await isSignedIn())) {
      // Přihlášení obvykle vrátí tam, odkud se šlo (?next=) — tu stránku
      // také přeskočit, jinak by „Zpět“ vedlo na tutéž adresu.
      const current = window.location.pathname;
      const target = previous.find((path) => !isSignedOutOnly(path) && path !== current);
      router.push(target ?? fallbackHref);
      return;
    }
    router.back();
  };

  return (
    <Link
      href={fallback}
      data-transition="manual"
      className="cl-btn cl-btn--ghost cl-btn--sm cl-back"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(() => void goBack());
      }}
    >
      <ArrowLeft size={16} strokeWidth={2} aria-hidden />
      <span>{t.common.back}</span>
    </Link>
  );
}
