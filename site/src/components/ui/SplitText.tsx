"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type JSX } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { PAGE_REVEALED_EVENT, PAGE_TRANSITION_ATTR } from "@/components/PageTransition";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

interface SplitTextProps {
  text: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines" | "chars,words" | string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: CSSProperties["textAlign"];
  tag?: keyof JSX.IntrinsicElements;
  onLetterAnimationComplete?: () => void;
}

type SplitElement = HTMLElement & { _rbsplitInstance?: GSAPSplitText | null };

// Resolves once the branded page-transition overlay is gone, so entrances
// never play out unseen behind it.
function pageRevealed() {
  if (!document.documentElement.hasAttribute(PAGE_TRANSITION_ATTR)) return Promise.resolve();
  return new Promise<void>((resolve) =>
    window.addEventListener(PAGE_REVEALED_EVENT, () => resolve(), { once: true }),
  );
}

const SplitText = ({
  text,
  className = "",
  style,
  id,
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
}: SplitTextProps) => {
  const ref = useRef<SplitElement | null>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    Promise.all([document.fonts.ready, pageRevealed()]).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !text || !ready) return;
      if (animationCompletedRef.current) return;

      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch {}
        el._rbsplitInstance = null;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
      const sign =
        marginValue === 0
          ? ""
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      let targets: Element[] | undefined;
      const assignTargets = (self: GSAPSplitText) => {
        if (splitType.includes("chars") && self.chars?.length) targets = self.chars;
        if (!targets && splitType.includes("words") && self.words?.length) targets = self.words;
        if (!targets && splitType.includes("lines") && self.lines?.length) targets = self.lines;
        if (!targets) targets = self.chars || self.words || self.lines;
      };

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === "lines",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        reduceWhiteSpace: false,
        onSplit: (self: GSAPSplitText) => {
          assignTargets(self);
          el.dataset.split = "";
          return gsap.fromTo(
            targets!,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              scrollTrigger: {
                trigger: el,
                start,
                once: true,
                fastScrollEnd: true,
                anticipatePin: 0.4,
              },
              onComplete: () => {
                animationCompletedRef.current = true;
                onCompleteRef.current?.();
              },
              willChange: "transform, opacity",
              force3D: true,
            },
          );
        },
      });

      el._rbsplitInstance = splitInstance;

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === el) st.kill();
        });
        try {
          splitInstance.revert();
        } catch {}
        el._rbsplitInstance = null;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        ready,
      ],
      scope: ref,
    },
  );

  const Tag = (tag || "p") as ElementType;
  return (
    <Tag
      ref={ref}
      id={id}
      style={{
        textAlign,
        overflow: "hidden",
        display: "inline-block",
        whiteSpace: "normal",
        wordWrap: "break-word",
        willChange: "transform, opacity",
        ...style,
      }}
      className={`split-parent ${className}`}
    >
      {text}
    </Tag>
  );
};

export default SplitText;
