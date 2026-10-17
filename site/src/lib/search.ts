// Hledání v administraci (přihlášky, uživatelé). Čisté funkce — běží
// v prohlížeči při psaní.

/** Bez diakritiky a velikosti písmen: „Novák“ najde i „novak“. */
const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const digitsOnly = (s: string) => s.replace(/\D/g, "");

/**
 * Sedí položka na hledaný výraz?
 *  - diakritika a velikost písmen nevadí,
 *  - víc slov = všechna musí sedět („novak leakers“),
 *  - telefon: stačí kus čísla, mezery a předvolba +420 nevadí („777 123“).
 *
 * `text` = všechno, podle čeho se má dát hledat (jméno, e-mail, kód…),
 * `phones` = telefonní čísla zvlášť, ať se porovnávají jen číslice.
 */
export function matchesSearch(query: string, text: string, phones: string[] = []): boolean {
  const q = normalize(query).trim();
  if (!q) return true;

  const qDigits = digitsOnly(q);
  if (qDigits.length >= 3 && /^[\d\s+()/-]+$/.test(q)) {
    const local = qDigits.replace(/^420/, "");
    const phoneHit = phones.some((phone) => {
      const d = digitsOnly(phone);
      return d.includes(qDigits) || (local.length >= 3 && d.includes(local));
    });
    if (phoneHit) return true;
  }

  // Telefon i jako jedno ze slov („733 zluty“).
  const hay = normalize([text, ...phones.map(digitsOnly)].join(" "));
  return q.split(/\s+/).every((word) => hay.includes(word));
}
