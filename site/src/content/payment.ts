// Účet pořadatele pro startovné (krok „Platba startovného“ v přihlášce týmu).
// Částka je u každého turnaje zvlášť (Rozpis turnajů → Startovné).
//
// IBAN je totéž číslo účtu v mezinárodním tvaru — potřebuje ho QR platba
// (formát SPAYD) a hodí se týmům, které platí ze zahraničí.

export const PAYMENT_ACCOUNT = {
  /** Číslo účtu / kód banky (Česká spořitelna). */
  number: "5815434013/0800",
  iban: "CZ4508000000005815434013",
} as const;
