import { localePath, type Locale } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { formatDate } from "@/lib/format";
import { PATHS } from "@/lib/portal/paths";

// E-maily s oznámením (schválená / zamítnutá přihláška…) přes Resend.
//
// Zapnou se samy, až budou ve Vercelu proměnné RESEND_API_KEY a MAIL_FROM
// (viz PRED-SPUSTENIM.md, krok 5). Do té doby se nic neposílá a kapitán se
// o změně dozví jen v portálu (oznámení). Selhání e-mailu nikdy nezastaví
// akci organizátora — změna se uloží a do logu se zapíše chyba.

export function mailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

async function sendMail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  if (!mailEnabled() || !to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text, html }),
    });
    if (!res.ok) {
      console.error("[e-mail] Resend odmítl zprávu", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[e-mail] nepodařilo se odeslat", error);
    return false;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type EntryMailKind = "approved" | "rejected" | "returned" | "removed";

/**
 * E-mail kapitánovi o rozhodnutí organizátora. Jazyk podle účtu kapitána
 * (profiles.locale), odkaz vede do jeho portálu.
 */
export async function sendEntryDecisionMail({
  kind,
  to,
  locale,
  name,
  team,
  tournament,
  startsOn,
  reason,
}: {
  kind: EntryMailKind;
  to: string;
  locale: Locale;
  name: string;
  team: string;
  tournament: string;
  startsOn: string;
  reason?: string;
}): Promise<boolean> {
  if (!mailEnabled()) return false;
  const t = getDictionaryFor(locale).mail;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const portalUrl = site ? `${site}${localePath(locale, PATHS.portal)}` : "";
  const vars = { team, tournament, date: formatDate(startsOn, locale), name };

  const subject = fmt(t.subject[kind], vars);
  const lines = [
    fmt(t.greeting, vars),
    fmt(t.body[kind], vars),
    kind === "rejected" && reason ? fmt(t.reason, { reason }) : "",
    kind === "rejected" ? t.rejectedHelp : "",
    portalUrl ? fmt(t.portal, { url: portalUrl }) : "",
    t.signature,
  ].filter(Boolean);

  const text = lines.join("\n\n");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#0a0a0a;color:#f2f2f0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6">
<div style="max-width:560px;margin:0 auto">
<p style="margin:0 0 20px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;color:#f5b300">Clutch League</p>
${lines
  .map((line) =>
    line.startsWith("http") || (portalUrl && line.includes(portalUrl))
      ? `<p style="margin:0 0 16px"><a href="${escapeHtml(portalUrl)}" style="color:#ffd34d">${escapeHtml(line)}</a></p>`
      : `<p style="margin:0 0 16px">${escapeHtml(line)}</p>`
  )
  .join("\n")}
</div></body></html>`;

  return sendMail(to, subject, text, html);
}
