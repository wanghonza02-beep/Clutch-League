"use client";

import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NAV_HEIGHT } from "@/lib/sectionScroll";

gsap.registerPlugin(ScrollTrigger);

const LINES = {
  run: "Jak funguje Clutch League?",
  ask: "Už tě nebaví basic fotbal?",
  answer: "Jseš tu správně!",
};

// Per-character spans for the float/morph effect. Words stay unbreakable
// inline-blocks and real spaces remain between them, so lines still wrap.
function splitChars(text: string) {
  const words = text.split(" ");
  return words.map((word, w) => (
    <Fragment key={w}>
      <span className="scrolly-word">
        {[...word].map((ch, i) => (
          <span key={i} className="scrolly-char">
            {ch}
          </span>
        ))}
      </span>
      {w < words.length - 1 && " "}
    </Fragment>
  ));
}

const FLOAT_FROM = {
  opacity: 0,
  yPercent: 120,
  scaleY: 2.3,
  scaleX: 0.7,
  transformOrigin: "50% 0%",
};
const FLOAT_TO = {
  opacity: 1,
  yPercent: 0,
  scaleY: 1,
  scaleX: 1,
  duration: 1,
  ease: "back.inOut(2)",
  stagger: 0.03,
};

export default function Scrollytelling() {
  const rootRef = useRef<HTMLElement>(null);
  const runRef = useRef<HTMLParagraphElement>(null);
  const askRef = useRef<HTMLParagraphElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const run = runRef.current;
    const ask = askRef.current;
    const answer = answerRef.current;
    if (!root || !run || !ask || !answer) return;

    // Reduced motion keeps the static stacked layout: no pin, no scrub.
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      root.classList.add("is-scrolly");

      const askChars = ask.querySelectorAll(".scrolly-char");
      const answerChars = answer.querySelectorAll(".scrolly-char");

      gsap.set(answer, { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          // Připnout pod lepící navigaci, ne pod horní okraj okna.
          start: `top ${NAV_HEIGHT}px`,
          end: "+=390%",
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // Phase 1: sweep from the right edge (only the first word visible) to fully off the left.
      tl.fromTo(
        run,
        { x: () => window.innerWidth * 0.7 },
        { x: () => -run.offsetWidth, duration: 1.8 }
      )
        .set(run, { autoAlpha: 0 })

        // Phase 2: second line floats up from below character by character, holds, clears.
        // Starts before phase 1 ends: back.inOut keeps the first chars invisible for a
        // while, so without the overlap there is an empty screen between the phases.
        .fromTo(askChars, FLOAT_FROM, FLOAT_TO, "-=0.3")
        .to({}, { duration: 0.6 })
        .to(ask, { autoAlpha: 0, yPercent: -40, duration: 0.6, ease: "power2.in" })

        // Phase 3: gold block rises in while its characters float up the same way.
        // Chars lead the block so it never shows empty, and the block overlaps the
        // phase 2 exit so the lines hand over without a blank beat.
        .fromTo(answerChars, FLOAT_FROM, FLOAT_TO, "-=0.4")
        .fromTo(
          answer,
          { autoAlpha: 0, yPercent: 60 },
          { autoAlpha: 1, yPercent: 0, duration: 1, ease: "power3.out" },
          "<0.3"
        )
        .to({}, { duration: 1 })

        // Clear the stage before the pin releases so nothing trails into the next section.
        .to(answer, { autoAlpha: 0, yPercent: -40, duration: 0.6, ease: "power2.in" });

      return () => root.classList.remove("is-scrolly");
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="jak-to-funguje"
      className="scrolly-stage"
      aria-labelledby="scrolly-title"
    >
      {/* h2: na úvodní stránce je h1 v hero sekci. */}
      <h2 id="scrolly-title" className="sr-only">
        {LINES.run} {LINES.ask} {LINES.answer}
      </h2>

      <p ref={runRef} aria-hidden className="scrolly-line scrolly-line--run cl-display">
        {LINES.run}
      </p>
      <p ref={askRef} aria-hidden className="scrolly-line scrolly-line--ask cl-display">
        {splitChars(LINES.ask)}
      </p>
      <div ref={answerRef} aria-hidden className="scrolly-line scrolly-line--answer">
        <span className="cl-glow-wrap">
          <span className="scrolly-answer cl-display">{splitChars(LINES.answer)}</span>
        </span>
      </div>
    </section>
  );
}
