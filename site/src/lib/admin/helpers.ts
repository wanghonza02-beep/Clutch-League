// Čisté pomocné funkce administrace (bez serverových importů).

const ZONE = "Europe/Prague";

const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function pragueParts(timestamp: number) {
  const out: Record<string, number> = {};
  for (const part of partsFormat.formatToParts(new Date(timestamp))) {
    if (part.type !== "literal") out[part.type] = Number(part.value);
  }
  return out;
}

/** Posun pražského času oproti UTC v daný okamžik (1 h v zimě, 2 h v létě). */
function pragueOffsetMs(timestamp: number): number {
  const p = pragueParts(timestamp);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(timestamp / 1000) * 1000;
}

/**
 * Hodnota z <input type="datetime-local"> ("2027-01-10T09:00"), zadaná v
 * pražském čase → ISO čas v UTC pro databázi. Neplatné datum (31. 2.) vrací null.
 */
export function pragueLocalToIso(local: string): string | null {
  const match = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);

  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(naive);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;

  // Offset závisí na okamžiku, který hledáme — dvě iterace stačí i kolem přechodu času.
  let guess = naive - pragueOffsetMs(naive);
  guess = naive - pragueOffsetMs(guess);
  return new Date(guess).toISOString();
}

/** ISO čas z databáze → hodnota pro <input type="datetime-local"> v pražském čase. */
export function isoToPragueLocal(iso: string): string {
  const p = pragueParts(new Date(iso).getTime());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** "Clutch Autumn Clash 2026" → "clutch-autumn-clash-2026" (bez diakritiky). */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Celé číslo z formuláře, nebo null u prázdného pole. NaN vrací pro neplatný vstup. */
export function intOrNull(raw: string): number | null {
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : Number.NaN;
}

/** Prázdný text → null (databáze pak drží NULL, ne prázdný řetězec). */
export function textOrNull(raw: string): string | null {
  return raw === "" ? null : raw;
}
