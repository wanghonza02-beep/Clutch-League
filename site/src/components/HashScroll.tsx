"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PAGE_REVEALED_EVENT, PAGE_TRANSITION_ATTR } from "@/components/PageTransition";
import { useHomePath } from "@/i18n/client";
import { cameFromHistory } from "@/lib/navHistory";
import { clearRememberedSection, peekRememberedSection, scrollToSection } from "@/lib/sectionScroll";

/**
 * Úvodní stránka je ta, kterou prohlížeč načetl znovu (obnovení) nebo
 * z historie (zpět z jiného webu) — pozici obnoví prohlížeč.
 */
function restoredLoad(): boolean {
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (entry?.type !== "reload" && entry?.type !== "back_forward") return false;
  return new URL(entry.name).pathname === window.location.pathname;
}

/**
 * Doskočí na sekci po příchodu na úvodní stránku:
 *
 *  - z navigace na podstránce (cíl uložený v sessionStorage) → plynule sjede,
 *    až zmizí přechodová animace,
 *  - z adresy s kotvou (/#fotky, sdílený odkaz) → skočí rovnou.
 *
 * Při návratu (zpět/vpřed, „Zpět“ na webu, obnovení stránky) se kotva
 * v adrese ignoruje: návštěvník má zůstat přesně tam, kde byl. Pozici vrací
 * lib/navHistory (při obnovení stránky prohlížeč).
 *
 * Next sám na kotvu skočí hned po načtení. Tady se posun pro jistotu zopakuje
 * po přepočtu ScrollTriggeru (animace nadpisů SplitText), kdyby se rozvržení
 * po načtení písem ještě dorovnalo.
 */
export default function HashScroll() {
  const home = useHomePath();

  useEffect(() => {
    // Cíl se smaže až po posunu: React efekt ve vývoji spustí dvakrát a
    // první (hned zrušený) běh nesmí cíl spotřebovat.
    const remembered = peekRememberedSection();
    if (!remembered && (cameFromHistory() || restoredLoad())) return;
    const id = remembered ?? decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      if (remembered) clearRememberedSection();
      scrollToSection(id, home, Boolean(remembered));
    };
    const timers: number[] = [];
    const later = () => timers.push(window.setTimeout(() => requestAnimationFrame(go), 60));

    if (remembered) {
      // Plynulý posun až po odkrytí stránky, ať ho návštěvník vidí.
      if (document.documentElement.hasAttribute(PAGE_TRANSITION_ATTR)) {
        window.addEventListener(PAGE_REVEALED_EVENT, later, { once: true });
      } else {
        later();
      }
      timers.push(window.setTimeout(go, 2500));
      return () => {
        window.removeEventListener(PAGE_REVEALED_EVENT, later);
        timers.forEach(window.clearTimeout);
      };
    }

    const onRefresh = () => requestAnimationFrame(go);
    ScrollTrigger.addEventListener("refresh", onRefresh);
    // Pojistka, kdyby se přepočet stihl dřív, než se tahle komponenta připojila.
    timers.push(window.setTimeout(go, 700));
    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      timers.forEach(window.clearTimeout);
    };
  }, [home]);

  return null;
}
