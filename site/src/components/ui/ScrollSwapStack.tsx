"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { NAV_HEIGHT } from "@/lib/sectionScroll";

/**
 * Sloupec krátkých řádků, které se při scrollu „přerolují“: řádek odjede
 * nahoru a zespodu ho nahradí jeho kopie. Podle Scroll and Swap
 * z fancycomponents.dev, jen bez knihovny motion — každý řádek má vlastní
 * pružinu (stiffness 200, damping 30 jako výchozí nastavení originálu).
 *
 * Počítač (≥ 1024 px): sloupec je přilepený a vyplňuje výšku okna. Průběh
 * řídí scroll přes .hiw__swap — řádky se přerolují postupně shora dolů jako
 * vlna (každý zabírá WINDOW průběhu, sousední se překrývají). Za tím
 * .hiw__hold: prodleva, kdy všechno stojí.
 * Mobil: nic se nepřilepuje, každý řádek se přeroluje, když vjíždí zespodu.
 *
 * Skupina s `accent` je zlatá (barva --gold). Celý sloupec je aria-hidden —
 * text pro čtečky dává sekce jednou.
 * S prefers-reduced-motion text stojí.
 */

type Group = { rows: string[]; accent?: boolean };

/** Jak velkou část průběhu zabere přerolování jednoho řádku. */
const WINDOW = 0.3;

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export default function ScrollSwapStack({ groups }: { groups: Group[] }) {
  const cellRef = useRef<HTMLDivElement>(null);
  const swapRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const currentRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const nextRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Pořadové číslo prvního řádku každé skupiny (řádky se číslují přes skupiny).
  const firstIndex = groups.map((_, g) => groups.slice(0, g).reduce((n, gr) => n + gr.rows.length, 0));
  const rowCount = groups.reduce((n, g) => n + g.rows.length, 0);

  useEffect(() => {
    const cell = cellRef.current;
    const swap = swapRef.current;
    if (!cell || !swap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    const n = rowCount;
    const target = new Array<number>(n).fill(0);
    const value = new Array<number>(n).fill(0);
    const velocity = new Array<number>(n).fill(0);
    const written = new Array<number>(n).fill(Number.NaN);
    let frame = 0;
    let last = 0;

    const measure = () => {
      if (desktop.matches) {
        const progress = clamp((NAV_HEIGHT - cell.getBoundingClientRect().top) / Math.max(1, swap.offsetHeight));
        for (let i = 0; i < n; i++) {
          const start = n > 1 ? (i * (1 - WINDOW)) / (n - 1) : 0;
          target[i] = clamp((progress - start) / WINDOW);
        }
        return;
      }
      const vh = window.innerHeight;
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        const rect = row.getBoundingClientRect();
        target[i] = clamp((vh - rect.top) / (rect.height + (vh - NAV_HEIGHT) * 0.2));
      });
    };

    // Do stylu se zapisuje jen při změně, ať prohlížeč zbytečně nepřekresluje.
    const write = (i: number) => {
      const rounded = Math.round(value[i] * 1000) / 1000;
      if (rounded === written[i]) return;
      written[i] = rounded;
      const current = currentRefs.current[i];
      const next = nextRefs.current[i];
      if (current) current.style.transform = `translateY(${-rounded * 100}%)`;
      if (next) next.style.transform = `translateY(${(1 - rounded) * 100}%)`;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      let moving = false;
      for (let i = 0; i < n; i++) {
        velocity[i] += (200 * (target[i] - value[i]) - 30 * velocity[i]) * dt;
        value[i] += velocity[i] * dt;
        if (Math.abs(target[i] - value[i]) < 0.0005 && Math.abs(velocity[i]) < 0.0005) {
          value[i] = target[i];
          velocity[i] = 0;
        } else {
          moving = true;
        }
        write(i);
      }
      frame = moving ? requestAnimationFrame(tick) : 0;
    };

    const onScroll = () => {
      measure();
      if (!frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };

    // Bez animace na výchozí stav (stránka může být načtená už odscrollovaná).
    const snap = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      measure();
      for (let i = 0; i < n; i++) {
        value[i] = target[i];
        velocity[i] = 0;
        write(i);
      }
    };
    snap();

    // Scroll se poslouchá jen tehdy, když je sloupec vidět.
    let listening = false;
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        listen(true);
        onScroll();
      } else {
        listen(false);
        snap();
      }
    });
    observer.observe(cell);

    return () => {
      observer.disconnect();
      listen(false);
      cancelAnimationFrame(frame);
    };
  }, [rowCount]);

  return (
    <div ref={cellRef} className="hiw__text" aria-hidden style={{ "--rows": rowCount } as CSSProperties}>
      <div className="hiw__lines">
        {groups.map((group, g) => (
          <p key={g} className={`hiw__group cl-display${group.accent ? " hiw__group--accent" : ""}`}>
            {group.rows.map((row, r) => {
              const i = firstIndex[g] + r;
              return (
                <span
                  key={i}
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  className="swap-text"
                >
                  <span className="swap-text__size">{row}</span>
                  <span
                    ref={(el) => {
                      currentRefs.current[i] = el;
                    }}
                    className="swap-text__layer"
                  >
                    {row}
                  </span>
                  <span
                    ref={(el) => {
                      nextRefs.current[i] = el;
                    }}
                    className="swap-text__layer"
                    style={{ transform: "translateY(100%)" }}
                  >
                    {row}
                  </span>
                </span>
              );
            })}
          </p>
        ))}
      </div>
      <div ref={swapRef} className="hiw__swap" />
      <div className="hiw__hold" />
    </div>
  );
}
