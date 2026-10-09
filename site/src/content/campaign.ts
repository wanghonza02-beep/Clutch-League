// Aktuální kampaň (turnajová sezóna) — PDF s jejími pravidly se ukazuje na
// úvodní stránce v sekci Pravidla, hned pod obecnými pravidly.
//
// Při další kampani (např. Summer Clutch League) nahraj nové PDF do
// public/docs/ a přepiš jen tenhle soubor. Obecná pravidla jsou v
// src/components/RulesSection.tsx a zůstávají beze změny.

export type Campaign = {
  /** Název kampaně, jak se ukazuje v nadpisu. */
  name: string;
  /** Krátké označení nad nadpisem. */
  label: string;
  pdf: {
    /** Cesta k PDF ve složce public (např. /docs/soubor.pdf). */
    href: string;
    /** Název souboru po stažení. */
    fileName: string;
    /** Popisek pod názvem, např. „PDF, 4 strany, 180 kB“. */
    meta: string;
    /** true = zatím jen zástupný soubor; na webu se zobrazí jasné označení. */
    placeholder: boolean;
  };
  /** Stránka s rozpisem zápasů a soupiskami týmů (data v winter-clutch-preview.ts). */
  preview?: { href: string; label: string };
};

export const CAMPAIGN: Campaign = {
  name: "Winter Clutch League",
  label: "Aktuální kampaň",
  pdf: {
    // ⚠️ ZÁSTUPNÝ SOUBOR. Až budou skutečná pravidla, nahraj PDF do public/docs/,
    // přepiš href, fileName a meta a nastav placeholder: false.
    href: "/docs/pravidla-kampan-zastupny-soubor.pdf",
    fileName: "Pravidla_Winter_Clutch_League.pdf",
    meta: "Pravidla doplníme před turnajem",
    placeholder: true,
  },
  preview: {
    href: "/winter-clutch",
    label: "Rozpis zápasů a týmy",
  },
};
