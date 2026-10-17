import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import BackButton from "@/components/BackButton";
import Notice from "@/components/ui/Notice";
import ZoomGallery from "@/components/ui/ZoomGallery";
import { ACTIVE_RULES, GENERAL_RULES_PDF, type RuleCard } from "@/content/rules";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { getDictionary, pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: pageTitle(t, t.rules.title),
    description: t.rules.metaDescription,
  };
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rules-section">
      <h2 id={id} className="rules-section__title">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Karty módů rovnou jako obrázky, klik je zvětší. Bez karet čistý prázdný stav.
 * `eager` = kolik prvních karet je vidět hned po načtení stránky.
 */
function Cards({
  cards,
  label,
  t,
  eager,
}: {
  cards: RuleCard[];
  label: string;
  t: Dictionary["rules"];
  eager?: number;
}) {
  if (cards.length === 0) return <Notice tone="info">{t.empty}</Notice>;

  const images = cards.map((card) => {
    const caption = fmt(t.cardAlt, { number: card.number, name: card.name, minutes: card.minutes });
    return {
      src: card.href,
      width: card.width,
      height: card.height,
      alt: caption,
      label: fmt(t.enlarge, { caption }),
    };
  });

  return (
    <ZoomGallery
      images={images}
      label={label}
      className="rules-cards"
      itemClassName="rules-card"
      sizes="(min-width: 1024px) 560px, 100vw"
      eager={eager}
    />
  );
}

// Pravidla bez animací: obecná pravidla (PDF, otevře se v nové záložce)
// a aktivní pravidla — karty módů vidět rovnou (src/content/rules.ts).
export default async function Pravidla() {
  const t = (await getDictionary()).rules;

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>
        <div className="cl-sectionhead">
          <h1
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
          >
            {t.title}
          </h1>
          <p className="cl-footer-meta">{t.hint}</p>
        </div>

        <Section id="obecna-pravidla" title={t.generalTitle}>
          <div className="cl-card">
            <div className="cl-card__in">
              <div className="cl-card__body rules-doc">
                <div className="rules-doc__file">
                  <FileText size={36} strokeWidth={2} color="var(--gold)" aria-hidden className="flex-none" />
                  <div className="flex flex-col gap-[var(--sp-1)]">
                    <span className="rules-doc__title">{t.generalPdfTitle}</span>
                    <span className="cl-footer-meta">{t.generalPdfMeta}</span>
                  </div>
                </div>
                <a
                  href={GENERAL_RULES_PDF}
                  target="_blank"
                  rel="noopener"
                  className="cl-btn cl-btn--secondary w-full flex-none sm:w-auto"
                  aria-label={`${t.open}: ${t.generalPdfTitle}`}
                >
                  <span>{t.open}</span>
                </a>
              </div>
            </div>
          </div>
        </Section>

        <Section id="aktivni-pravidla" title={t.activeTitle}>
          <Cards cards={ACTIVE_RULES} label={t.activeTitle} t={t} eager={2} />
        </Section>
      </div>
    </main>
  );
}
