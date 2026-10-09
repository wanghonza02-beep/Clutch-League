// Aktuální kampaň (turnajová sezóna) — PDF s jejími pravidly se ukazuje na
// úvodní stránce v sekci Pravidla, hned pod obecnými pravidly.
//
// Při další kampani (např. Summer Clutch League) nahraj nové PDF do
// public/docs/ a přepiš jen tenhle soubor. Obecná pravidla jsou v
// src/components/RulesSection.tsx a zůstávají beze změny.

import { WINTER_PREVIEW } from "@/content/winter-clutch-preview";

export type Campaign = {
  /** Název kampaně, jak se ukazuje v nadpisu. */
  name: string;
  /** Krátké označení nad nadpisem. */
  label: string;
  /** PDF s pravidly kampaně. Bez něj web napíše, že pravidla zveřejníme před turnajem. */
  pdf?: {
    /** Cesta k PDF ve složce public (např. /docs/soubor.pdf). */
    href: string;
    /** Název souboru po stažení. */
    fileName: string;
    /** Popisek pod názvem, např. „PDF, 4 strany, 180 kB“. */
    meta: string;
  };
  /** Stránka s rozpisem zápasů a soupiskami týmů (data v winter-clutch-preview.ts). */
  preview?: { href: string; label: string };
};

export const CAMPAIGN: Campaign = {
  name: "Winter Clutch League",
  label: "Aktuální kampaň",
  // Až budou pravidla, nahraj PDF do public/docs/ a doplň:
  //   pdf: {
  //     href: "/docs/pravidla-winter-clutch-league.pdf",
  //     fileName: "Pravidla_Winter_Clutch_League.pdf",
  //     meta: "PDF, 4 strany, 180 kB",
  //   },
  // Odkaz na rozpis jen tehdy, když v něm jsou skutečné týmy.
  preview:
    WINTER_PREVIEW.teams.length > 0
      ? { href: "/winter-clutch", label: "Rozpis zápasů a týmy" }
      : undefined,
};
