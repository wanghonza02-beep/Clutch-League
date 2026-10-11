"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PAGE_REVEALED_EVENT, PAGE_TRANSITION_ATTR } from "@/components/PageTransition";
import { useHomePath } from "@/i18n/client";
import { clearRememberedSection, peekRememberedSection, scrollToSection } from "@/lib/sectionScroll";

/**
 * Doskočí na sekci po příchodu na úvodní stránku:
 *
 *  - z navigace na podstránce (cíl uložený v sessionStorage) → plynule sjede,
 *    až zmizí přechodová animace,
 *  - z adresy s kotvou (/#pravidla, sdílený odkaz) → skočí rovnou.
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
