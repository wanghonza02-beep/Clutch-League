// Fotky v galerii na úvodní stránce (sekce Fotky). Soubory jsou v public/galerie:
// <id>.webp (nejvýš 1600 px, pro zvětšení) a <id>-nahled.webp (náhled do galerie).
//
// Pravidlo pro fotky: hráči Žlutého baletu smějí být vidět celí. U ostatních týmů
// jen číslo — bez obličeje a bez příjmení na dresu (proto jsou některé fotky oříznuté
// a jiné ze složky na Disku chybí). Popisky (alt) jsou ve slovnících, část photos.alts.

export type GalleryAlt = "team" | "keeper" | "banner" | "match" | "award" | "player";

// Pořadí = rozložení do sloupců (1., 5., 9.… fotka do prvního sloupce) a pořadí
// při listování; bannery jsou rozházené, ať nejsou pod sebou.
export const GALLERY: { id: string; alt: GalleryAlt; width: number; height: number }[] = [
  { id: "01", alt: "team", width: 1200, height: 1600 },
  { id: "04", alt: "match", width: 1140, height: 1600 },
  { id: "03", alt: "banner", width: 1200, height: 1600 },
  { id: "02", alt: "keeper", width: 1200, height: 1600 },
  { id: "18", alt: "player", width: 953, height: 1600 },
  { id: "07", alt: "banner", width: 1200, height: 1600 },
  { id: "08", alt: "match", width: 1200, height: 1600 },
  { id: "05", alt: "award", width: 1200, height: 1600 },
  { id: "12", alt: "banner", width: 1200, height: 1600 },
  { id: "06", alt: "match", width: 1200, height: 1600 },
  { id: "10", alt: "keeper", width: 1200, height: 1600 },
  { id: "22", alt: "banner", width: 1200, height: 1600 },
  { id: "13", alt: "player", width: 824, height: 1098 },
  { id: "11", alt: "match", width: 996, height: 1600 },
  { id: "16", alt: "banner", width: 1200, height: 1600 },
  { id: "09", alt: "team", width: 1200, height: 1600 },
  { id: "15", alt: "match", width: 1200, height: 1600 },
  { id: "19", alt: "banner", width: 1200, height: 1600 },
  { id: "17", alt: "keeper", width: 1200, height: 1600 },
  { id: "14", alt: "match", width: 756, height: 1600 },
  { id: "25", alt: "banner", width: 1200, height: 1600 },
  { id: "20", alt: "match", width: 960, height: 1600 },
  { id: "21", alt: "match", width: 1128, height: 1600 },
  { id: "26", alt: "banner", width: 1200, height: 1600 },
  { id: "24", alt: "keeper", width: 1152, height: 1600 },
  { id: "23", alt: "match", width: 840, height: 1600 },
];
