// Aktuální kampaň (turnajová sezóna). Pravidla jsou na stránce /pravidla
// (src/content/rules.ts); tady je jen odkaz na rozpis zápasů a soupisky,
// který ukazuje archiv odehraných turnajů. Popisek („Rozpis zápasů a týmy“)
// je ve slovnících jazyků (část rules).

import { WINTER_PREVIEW } from "@/content/winter-clutch-preview";

export type Campaign = {
  /** Stránka s rozpisem zápasů a soupiskami týmů (data v winter-clutch-preview.ts). */
  previewHref?: string;
};

export const CAMPAIGN: Campaign = {
  // Odkaz na rozpis jen tehdy, když v něm jsou skutečné týmy.
  previewHref: WINTER_PREVIEW.teams.length > 0 ? "/winter-clutch" : undefined,
};
