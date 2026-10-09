// Recenze hráčů na úvodní stránce (sekce „Proč zrovna Clutch League“).
//
// Jen skutečné citace, se kterými hráč souhlasil. Jméno piš jako křestní jméno
// a iniciálu příjmení, např.:
//   { name: "Tomáš K.", role: "Kapitán týmu", quote: "Organizace na jedničku…" },
//
// Dokud je seznam prázdný, sekce na úvodní stránce i odkaz „Proč my“
// v navigaci se neukazují.

export type Review = {
  name: string;
  role: string;
  quote: string;
};

export const REVIEWS: Review[] = [];
