import { CalendarDays, Download, FileText } from "lucide-react";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import { CAMPAIGN, type Campaign } from "@/content/campaign";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getDictionary } from "@/i18n/server";

// Pravidla na úvodní stránce — pravý sloupec sekce „Jak to funguje“
// (HowItWorksSection), od lg přilepený pod lištou. Mají dvě části:
//   1. Obecná pravidla — platí pořád, bez ohledu na kampaň (PDF níže).
//   2. Pravidla kampaně — vždy jako PDF; cesta a popisek jsou v
//      src/content/campaign.ts. Při nové kampani se sahá jen tam.
// PDF jsou česky; v ostatních jazycích to říká popisek pod názvem.

const GENERAL_PDF = {
  href: "/docs/pravidla-clutch-league-cup-2026.pdf",
  fileName: "Pravidla_Clutch_League_Cup_2026.pdf",
};

const fileTitle = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-display)",
  fontSize: "var(--fs-h5)",
  lineHeight: "var(--lh-snug)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
} as const;

function PdfCard({
  title,
  meta,
  href,
  fileName,
  download,
}: {
  title: string;
  meta: string;
  href: string;
  fileName: string;
  download: string;
}) {
  return (
    <div className="cl-card w-full">
      <div className="cl-card__in">
        <div className="cl-card__body hiw-rules__card">
          <div className="flex items-center gap-[var(--sp-4)]">
            <FileText size={36} strokeWidth={2} color="var(--gold)" aria-hidden className="flex-none" />
            <div className="flex flex-col gap-[var(--sp-1)]">
              <span style={fileTitle}>{title}</span>
              <span className="cl-footer-meta">{meta}</span>
            </div>
          </div>
          <a href={href} download={fileName} className="cl-btn cl-btn--primary w-full sm:w-auto sm:self-start">
            <Download size={16} aria-hidden />
            <span>{download}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function CampaignRules({ campaign, t }: { campaign: Campaign; t: Dictionary["rules"] }) {
  const { pdf } = campaign;
  const title = fmt(t.campaignTitle, { name: campaign.name });
  return (
    <div className="hiw-rules__part">
      <div className="cl-sectionhead">
        <span className="cl-sectionhead__over">{t.campaignOver}</span>
        <h3 className="hiw-rules__part-title">{title}</h3>
        <p className="cl-sectionhead__sub">{t.campaignSub}</p>
      </div>

      {pdf ? (
        <PdfCard title={title} href={pdf.href} fileName={pdf.fileName} meta={pdf.meta} download={t.download} />
      ) : (
        <Notice tone="info">{fmt(t.campaignSoon, { name: campaign.name })}</Notice>
      )}

      {campaign.previewHref && (
        <div className="cl-card cl-card--flat w-full">
          <div className="cl-card__in">
            <div className="cl-card__body hiw-rules__card">
              <div className="flex items-center gap-[var(--sp-4)]">
                <CalendarDays size={36} strokeWidth={2} color="var(--gold)" aria-hidden className="flex-none" />
                <div className="flex flex-col gap-[var(--sp-1)]">
                  <span style={fileTitle}>{t.previewLabel}</span>
                  <span className="cl-footer-meta">{t.previewMeta}</span>
                </div>
              </div>
              <Link href={campaign.previewHref} className="cl-btn cl-btn--secondary w-full sm:w-auto sm:self-start">
                <span>{t.previewButton}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Obsah pravidel bez vlastní sekce — obaluje ho HowItWorksSection. */
export default async function RulesSection() {
  const t = (await getDictionary()).rules;

  return (
    <div className="hiw-rules">
      <SplitText
        tag="h2"
        id="pravidla-title"
        className="cl-display hiw-rules__title"
        text={t.title}
        textAlign="left"
        splitType="words"
        delay={90}
      />

      {/* 1) Obecná pravidla — beze změny napříč kampaněmi. */}
      <div className="hiw-rules__part">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.alwaysOver}</span>
          <h3 className="hiw-rules__part-title">{t.generalTitle}</h3>
          <p className="cl-sectionhead__sub">{t.generalSub}</p>
        </div>
        <PdfCard {...GENERAL_PDF} title={t.generalPdfTitle} meta={t.generalPdfMeta} download={t.download} />
      </div>

      {/* 2) Pravidla aktuální kampaně — z src/content/campaign.ts. */}
      <CampaignRules campaign={CAMPAIGN} t={t} />
    </div>
  );
}
