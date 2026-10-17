// QR platba (Short Payment Descriptor, SPAYD) — formát, který načtou všechny
// české bankovní aplikace. Čisté funkce, běží i v prohlížeči.
//   SPD*1.0*ACC:CZ…*AM:2700.00*CC:CZK*MSG:ZLUTY BALET*

/** Zpráva pro příjemce: bez diakritiky a hvězdiček (oddělovač SPAYD), nejvýš 60 znaků. */
function spaydText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** Obsah QR kódu platby v Kč na IBAN, se zprávou pro příjemce (název týmu). */
export function spaydPayment({ iban, amount, message }: { iban: string; amount: number; message: string }): string {
  const parts = ["SPD", "1.0", `ACC:${iban}`, `AM:${amount.toFixed(2)}`, "CC:CZK"];
  const msg = spaydText(message);
  if (msg) parts.push(`MSG:${msg}`);
  return `${parts.join("*")}*`;
}

/** IBAN po čtveřicích pro čtení: "CZ45 0800 0000 0058 1543 4013". */
export function formatIban(iban: string): string {
  return iban.replace(/(.{4})(?=.)/g, "$1 ");
}
