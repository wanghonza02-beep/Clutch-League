// In-site navigation trail. The browser history also holds entries from other
// sites (e.g. a search engine), so "back" must only use router.back() when the
// previous entry is known to be one of our own pages.
//
// The trail mirrors the browser history for our pages: a navigation that came
// from the browser's back/forward (popstate) steps back in the trail, anything
// else (links, router.push, redirects after a form) adds a new entry.
//
// Pozice na stránce: ke každé stránce v trail se pamatuje, kam byla odscrollovaná.
// Při návratu (zpět v prohlížeči i „Zpět“ na webu) se pozice vrátí. Obnově
// prohlížeče se věřit nedá: Next při návratu přepíše záznam historie a Chrome
// pak skočí na kotvu v adrese (např. #jak-to-funguje) místo na místo, kde
// návštěvník byl.
const trail: string[] = [];
const scrolls: number[] = [];
/** Stránka, na kterou se naposledy přišlo zpět/vpřed (popstate), dokud se z ní neodejde. */
let poppedPath: string | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    poppedPath = window.location.pathname;
  });
  // Ukládá se jen pozice stránky, která je opravdu poslední v trail. Během
  // přechodu má adresa už novou cestu, takže posun nové stránky nahoru starou
  // pozici nepřepíše.
  window.addEventListener(
    "scroll",
    () => {
      const last = trail.length - 1;
      if (last >= 0 && trail[last] === window.location.pathname) scrolls[last] = window.scrollY;
    },
    { passive: true }
  );
}

/** Vrátí pozici po vykreslení stránky, i kdyby ji prohlížeč mezitím posunul jinam. */
function restoreScroll(top: number) {
  window.scrollTo({ top, behavior: "instant" });
  requestAnimationFrame(() => window.scrollTo({ top, behavior: "instant" }));
}

export function recordPath(path: string) {
  const fromPopstate = poppedPath === path;
  if (!fromPopstate) poppedPath = null;
  if (trail[trail.length - 1] === path) return;
  if (fromPopstate && trail.length > 1 && trail[trail.length - 2] === path) {
    trail.pop();
    scrolls.pop();
    restoreScroll(scrolls[scrolls.length - 1] ?? 0);
  } else {
    trail.push(path);
    scrolls.push(window.scrollY);
  }
}

/** Our pages before the current one, nearest first. */
export function previousPaths(): string[] {
  return trail.slice(0, -1).reverse();
}

/**
 * Přišla aktuální stránka z historie (zpět/vpřed v prohlížeči nebo „Zpět“ na
 * webu)? Pak se nemá skákat na kotvu v adrese, pozici vrací recordPath.
 * Bez časových oken a nezávisle na pořadí volání s recordPath.
 */
export function cameFromHistory(): boolean {
  return poppedPath !== null && poppedPath === window.location.pathname;
}
