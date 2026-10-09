"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";
import Notice from "@/components/ui/Notice";

/** Archiv se načítá z databáze — když je nedostupná, nabídneme zkusit znovu. */
export default function TurnajeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-6)]">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">Archiv</span>
          <h1
            className="cl-display"
            style={{ fontSize: "var(--fs-h2)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
          >
            Výsledky se nenačetly
          </h1>
        </div>
        <Notice tone="error">
          Nepodařilo se spojit s databází. Zkus to prosím za chvíli znovu.
        </Notice>
        <div className="flex flex-wrap gap-[var(--sp-3)]">
          <button type="button" className="cl-btn cl-btn--primary" onClick={reset}>
            <RotateCw size={16} strokeWidth={2} aria-hidden />
            <span>Zkusit znovu</span>
          </button>
          <Link href="/" className="cl-btn cl-btn--ghost">
            <span>Na úvod</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
