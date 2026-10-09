// Plynulé posouvání na sekce úvodní stránky (jen v prohlížeči).
//
// Na úvodní stránce se sjede rovnou. Z podstránky se cíl uloží, přejde se na
// úvodní stránku a sjede se až po načtení (HashScroll) — pod animací „Jak to
// funguje“ se totiž obsah po načtení ještě posune.

/** Výška lepící navigace (= .cl-nav, --nav-h v globals.css). */
export const NAV_HEIGHT = 76;

const PENDING_KEY = "cl:scroll-to";

function smoothAllowed(): boolean {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Sjede na sekci (odsazení pod lištou řeší scroll-padding v CSS) a zapíše kotvu do adresy. */
export function scrollToSection(id: string, smooth = true): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: smooth && smoothAllowed() ? "smooth" : "auto", block: "start" });
  history.replaceState(null, "", `/#${id}`);
  return true;
}

/** Úplný začátek úvodní stránky — nad první sekci. */
export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: smoothAllowed() ? "smooth" : "auto" });
  history.replaceState(null, "", "/");
}

export function rememberSection(id: string): void {
  try {
    sessionStorage.setItem(PENDING_KEY, id);
  } catch {
    // Bez sessionStorage (soukromý režim) se přejde jen na úvodní stránku.
  }
}

/** Uložený cíl, beze změny. Smaže se až clearRememberedSection() po posunu. */
export function peekRememberedSection(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

export function clearRememberedSection(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // nic
  }
}
