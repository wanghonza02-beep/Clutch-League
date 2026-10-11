"use client";

import { RotateCw } from "lucide-react";
import Notice from "@/components/ui/Notice";
import { useT } from "@/i18n/client";
import Link from "@/i18n/Link";

/** Archiv se načítá z databáze — když je nedostupná, nabídneme zkusit znovu. */
export default function TurnajeError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-6)]">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.archiveError.over}</span>
          <h1
            className="cl-display"
            style={{ fontSize: "var(--fs-h2)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
          >
            {t.archiveError.title}
          </h1>
        </div>
        <Notice tone="error">{t.archiveError.text}</Notice>
        <div className="flex flex-wrap gap-[var(--sp-3)]">
          <button type="button" className="cl-btn cl-btn--primary" onClick={reset}>
            <RotateCw size={16} strokeWidth={2} aria-hidden />
            <span>{t.archiveError.retry}</span>
          </button>
          <Link href="/" className="cl-btn cl-btn--ghost">
            <span>{t.common.toHome}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
