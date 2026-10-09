import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import InstagramIcon from "@/components/InstagramIcon";

export const metadata: Metadata = {
  title: "Kontakt | Clutch League",
  description: "Napiš nám na Instagram @clutchleague_football.",
};

const INSTAGRAM = {
  handle: "@clutchleague_football",
  href: "https://www.instagram.com/clutchleague_football/",
};

export default function Kontakt() {
  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>
        <div className="cl-sectionhead">
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text="Kontakt"
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">
            Nejrychleji nás zastihneš na Instagramu. Napiš nám DM a ozveme se.
          </p>
        </div>

        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body flex flex-col items-center gap-[var(--sp-6)] text-center sm:flex-row sm:text-left">
              <span className="flex-none" style={{ color: "var(--gold)" }}>
                <InstagramIcon size={40} />
              </span>
              <div className="flex flex-1 flex-col gap-[var(--sp-1)]">
                <span className="cl-field__label">Instagram</span>
                <a
                  href={INSTAGRAM.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: "var(--fw-display)",
                    fontSize: "var(--fs-h4)",
                    lineHeight: "var(--lh-snug)",
                    textDecoration: "none",
                    overflowWrap: "anywhere",
                  }}
                >
                  {INSTAGRAM.handle}
                </a>
              </div>
              <a
                href={INSTAGRAM.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cl-btn cl-btn--primary w-full flex-none sm:w-auto"
              >
                <InstagramIcon size={16} />
                <span>Napsat na Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
