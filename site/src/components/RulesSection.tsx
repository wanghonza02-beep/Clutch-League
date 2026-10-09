import Link from "next/link";
import { CalendarDays, Download, FileText } from "lucide-react";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import { CAMPAIGN, type Campaign } from "@/content/campaign";

// Pravidla mají dvě části:
//   1. Obecná pravidla — platí pořád, bez ohledu na kampaň (PDF níže).
//   2. Pravidla kampaně — vždy jako PDF; cesta a popisek jsou v
//      src/content/campaign.ts. Při nové kampani se sahá jen tam.

const GENERAL_PDF = {
  href: "/docs/pravidla-clutch-league-cup-2026.pdf",
  fileName: "Pravidla_Clutch_League_Cup_2026.pdf",
  title: "Pravidla Clutch League Cup 2026",
  meta: "PDF, 8 stran, 219 kB",
};

const partTitle = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-display)",
  fontStyle: "italic",
  fontSize: "var(--fs-h3)",
  lineHeight: "var(--lh-heading)",
  letterSpacing: "var(--ls-display)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
  margin: 0,
} as const;

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
}: {
  title: string;
  meta: string;
  href: string;
  fileName: string;
}) {
  return (
    <div className="cl-card w-full">
      <div className="cl-card__in">
        <div className="cl-card__body flex flex-col items-center gap-[var(--sp-6)] text-center sm:flex-row sm:text-left">
          <FileText size={40} strokeWidth={2} color="var(--gold)" aria-hidden className="flex-none" />
          <div className="flex flex-1 flex-col items-center gap-[var(--sp-1)] sm:items-start">
            <span style={fileTitle}>{title}</span>
            <span className="cl-footer-meta">{meta}</span>
          </div>
          <a href={href} download={fileName} className="cl-btn cl-btn--primary w-full flex-none sm:w-auto">
            <Download size={16} aria-hidden />
            <span>Stáhnout pravidla</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function CampaignRules({ campaign }: { campaign: Campaign }) {
  const { pdf } = campaign;
  return (
    <div className="flex flex-col gap-[var(--sp-6)]">
      <div className="cl-sectionhead">
        <span className="cl-sectionhead__over">{campaign.label}</span>
        <h3 style={partTitle}>Pravidla {campaign.name}</h3>
        <p className="cl-sectionhead__sub">
          Platí jen pro tuhle kampaň, navíc k obecným pravidlům.
        </p>
      </div>

      {pdf ? (
        <PdfCard
          title={`Pravidla ${campaign.name}`}
          href={pdf.href}
          fileName={pdf.fileName}
          meta={pdf.meta}
        />
      ) : (
        <Notice tone="info">Pravidla {campaign.name} zveřejníme před turnajem.</Notice>
      )}

      {campaign.preview && (
        <div className="cl-card cl-card--flat w-full">
          <div className="cl-card__in">
            <div className="cl-card__body flex flex-col items-center gap-[var(--sp-6)] text-center sm:flex-row sm:text-left">
              <CalendarDays size={40} strokeWidth={2} color="var(--gold)" aria-hidden className="flex-none" />
              <div className="flex flex-1 flex-col items-center gap-[var(--sp-1)] sm:items-start">
                <span style={fileTitle}>{campaign.preview.label}</span>
                <span className="cl-footer-meta">Kdo s kým hraje, kdy, skupiny a soupisky týmů.</span>
              </div>
              <Link href={campaign.preview.href} className="cl-btn cl-btn--secondary w-full flex-none sm:w-auto">
                <span>Zobrazit rozpis</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RulesSection() {
  return (
    <section
      id="pravidla"
      aria-labelledby="pravidla-title"
      className="cl-section relative overflow-hidden bg-[var(--black)]"
    >
      <div className="cl-container-narrow flex w-full flex-col gap-[var(--sp-16)]">
        <SplitText
          tag="h2"
          id="pravidla-title"
          className="cl-display"
          style={{
            fontSize: "var(--fs-display-2)",
            fontStyle: "italic",
            lineHeight: "var(--lh-heading)",
          }}
          text="Přečti si naše pravidla!"
          splitType="words"
          delay={90}
        />

        {/* 1) Obecná pravidla — beze změny napříč kampaněmi. */}
        <div className="flex flex-col gap-[var(--sp-6)]">
          <div className="cl-sectionhead">
            <span className="cl-sectionhead__over">Platí vždy</span>
            <h3 style={partTitle}>Obecná pravidla</h3>
            <p className="cl-sectionhead__sub">
              Platí pro všechny turnaje Clutch League, ať je zrovna jakákoli kampaň.
            </p>
          </div>
          <PdfCard {...GENERAL_PDF} />
        </div>

        {/* 2) Pravidla aktuální kampaně — z src/content/campaign.ts. */}
        <CampaignRules campaign={CAMPAIGN} />
      </div>
    </section>
  );
}
