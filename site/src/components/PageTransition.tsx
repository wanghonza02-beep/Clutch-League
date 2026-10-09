"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

type Phase = "idle" | "snap" | "enter" | "cover" | "leave";

const FADE_IN_MS = 320;
const FADE_OUT_MS = 480;
const MIN_VISIBLE_MS = 1100;
const FAILSAFE_MS = 6000;

export const PAGE_REVEALED_EVENT = "cl:page-revealed";
export const PAGE_TRANSITION_ATTR = "data-page-transition";

function clearTimers(timers: number[]) {
  timers.forEach(clearTimeout);
  timers.length = 0;
}
function later(timers: number[], ms: number, fn: () => void) {
  timers.push(window.setTimeout(fn, ms));
}

type Navigate = (action: () => void) => void;
const TransitionContext = createContext<Navigate>((action) => action());

/** Runs a navigation (router.push, router.back…) behind the branded overlay. */
export const useTransitionNavigate = () => useContext(TransitionContext);

export default function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");

  const phaseRef = useRef<Phase>("idle");
  const pathRef = useRef(pathname);
  const startedAt = useRef(0);
  const timers = useRef<number[]>([]);

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const reveal = useCallback(() => {
    clearTimers(timers.current);
    const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt.current));
    later(timers.current, wait, () => {
      go("leave");
      document.documentElement.removeAttribute(PAGE_TRANSITION_ATTR);
      window.dispatchEvent(new Event(PAGE_REVEALED_EVENT));
      later(timers.current, FADE_OUT_MS, () => go("idle"));
    });
  }, [go]);

  const begin = useCallback(
    (instant: boolean, action?: () => void) => {
      clearTimers(timers.current);
      startedAt.current = performance.now();
      document.documentElement.setAttribute(PAGE_TRANSITION_ATTR, "");
      go(instant ? "snap" : "enter");
      later(timers.current, instant ? 0 : FADE_IN_MS, () => {
        go("cover");
        action?.();
      });
      // Navigations that never change the pathname must not leave the overlay up.
      later(timers.current, FAILSAFE_MS, reveal);
    },
    [go, reveal],
  );

  const navigate = useCallback<Navigate>(
    (action) => {
      if (phaseRef.current !== "idle" && phaseRef.current !== "leave") return;
      begin(false, action);
    },
    [begin],
  );

  useEffect(() => {
    if (pathname === pathRef.current) return;
    pathRef.current = pathname;
    if (phaseRef.current !== "idle") reveal();
  }, [pathname, reveal]);

  useEffect(() => {
    // Capture phase on window runs before React's Link handler; a prevented
    // click makes next/link skip its own navigation, so we push after the fade.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.hasAttribute("download") || a.dataset.transition === "manual") return;
      if (a.target && a.target !== "_self") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;

      e.preventDefault();
      const href = url.pathname + url.search + url.hash;
      navigate(() => router.push(href));
    };

    const onPopState = () => {
      if (location.pathname === pathRef.current) return;
      if (["snap", "enter", "cover"].includes(phaseRef.current)) return;
      begin(true);
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [begin, navigate, router]);

  useEffect(() => {
    const pending = timers.current;
    return () => clearTimers(pending);
  }, []);

  const active = phase !== "idle";

  return (
    <TransitionContext.Provider value={navigate}>
      {children}
      <div className="pt-overlay" data-phase={phase} aria-hidden={!active}>
        <div className="pt-overlay__logo">
          <Image
            src="/brand-logo.jpg"
            alt=""
            width={720}
            height={720}
            sizes="(min-width: 640px) 280px, 200px"
            loading="eager"
          />
        </div>
        {active && (
          <span className="sr-only" role="status">
            Načítám stránku
          </span>
        )}
      </div>
    </TransitionContext.Provider>
  );
}
