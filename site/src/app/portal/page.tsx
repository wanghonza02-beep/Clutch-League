import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardPen, Inbox, Send, Trophy, Users } from "lucide-react";
import Notice from "@/components/ui/Notice";
import { getAdminOverview } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";
import { PLAYERS_ACC, PLAYERS_NOM, plural } from "@/lib/plural";
import { getCaptainTeam, getOpenTournament, getTeamEntry } from "@/lib/portal/data";
import { PATHS } from "@/lib/portal/paths";
import { requireUser } from "@/lib/portal/session";
import { ENTRY_STATUS_LABEL } from "@/lib/portal/types";

export const metadata: Metadata = {
  title: "Přehled | Portál Clutch League",
};

const headingStyle = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-display)",
  fontStyle: "italic",
  fontSize: "var(--fs-h2)",
  lineHeight: "var(--lh-heading)",
  letterSpacing: "var(--ls-display)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
  margin: 0,
} as const;

export default async function PortalPrehled({ searchParams }: PageProps<"/portal">) {
  const user = await requireUser();
  const passwordChanged = (await searchParams).heslo === "zmeneno";

  const passwordNotice = passwordChanged && (
    <Notice tone="ok" live>
      Heslo je změněné. Příště se přihlas tím novým.
    </Notice>
  );

  if (user.role === "admin") {
    const overview = await getAdminOverview();

    return (
      <>
        {passwordNotice}
        <header className="cl-sectionhead">
          <span className="cl-sectionhead__over">Organizátor</span>
          <h1 style={headingStyle}>Dobrý den, {user.name}</h1>
          <p className="cl-sectionhead__sub">
            Tady spravuješ přihlášky týmů, turnaje, zápasy, výsledky a uživatele.
          </p>
        </header>

        <dl className="hist-timeline__stats">
          <div className={`cl-stat${overview.pendingEntries > 0 ? " cl-stat--accent" : ""}`}>
            <dt className="cl-stat__label">Čeká na schválení</dt>
            <dd className="cl-stat__val order-first">{overview.pendingEntries}</dd>
          </div>
          <div className="cl-stat">
            <dt className="cl-stat__label">Registrovaných účtů</dt>
            <dd className="cl-stat__val order-first">{overview.users}</dd>
          </div>
        </dl>

        {overview.pendingEntries > 0 && (
          <Notice tone="accent">
            Máš {overview.pendingEntries} {plural(overview.pendingEntries, ["přihlášku", "přihlášky", "přihlášek"])}{" "}
            ke schválení.
          </Notice>
        )}

        {overview.upcoming.length === 0 ? (
          <Notice tone="info">Není naplánovaný žádný nadcházející turnaj. Založ ho v sekci Turnaje.</Notice>
        ) : (
          <ul className="flex flex-col gap-[var(--sp-3)]" aria-label="Nadcházející turnaje">
            {overview.upcoming.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-[var(--sp-3)]">
                <Link
                  href={`/portal/turnaje/${t.id}`}
                  className="adm-item__title"
                  style={{ textDecoration: "none" }}
                >
                  {t.name}
                </Link>
                <span className="roster-row__meta cl-num">{formatDate(t.startsOn)}</span>
                <span className={t.registrationOpen ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                  {t.registrationOpen ? "Přihlášky otevřené" : "Přihlášky zavřené"}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-[var(--sp-3)]">
          <Link href="/portal/prihlasky" className="cl-btn cl-btn--primary">
            <Inbox size={16} strokeWidth={2} aria-hidden />
            <span>Přihlášky týmů</span>
          </Link>
          <Link href="/portal/vysledky" className="cl-btn cl-btn--secondary">
            <ClipboardPen size={16} strokeWidth={2} aria-hidden />
            <span>Zapsat výsledky</span>
          </Link>
          <Link href="/portal/turnaje" className="cl-btn cl-btn--ghost">
            <Trophy size={16} strokeWidth={2} aria-hidden />
            <span>Turnaje</span>
          </Link>
        </div>
      </>
    );
  }

  const [team, tournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);

  // Kapitán bez týmu: tým vzniká jen přes přihlášku, ne v portálu.
  if (!team) {
    return (
      <>
        {passwordNotice}
        <header className="cl-sectionhead">
          <span className="cl-sectionhead__over">Přehled</span>
          <h1 style={headingStyle}>Vítej, {user.name}</h1>
          <p className="cl-sectionhead__sub">
            {tournament
              ? `Účet máš. Teď přihlas svůj tým na ${tournament.name} a pak doplň soupisku.`
              : "Účet máš. Přihlášky na turnaj jsou teď zavřené — dáme vědět, až se otevřou."}
          </p>
        </header>

        {tournament && (
          <div>
            <Link href={PATHS.teamRegistration} className="cl-btn cl-btn--primary cl-btn--lg">
              <Send size={18} strokeWidth={2} aria-hidden />
              <span>Přihlásit tým</span>
            </Link>
          </div>
        )}
      </>
    );
  }

  const entry = tournament ? await getTeamEntry(team.id, tournament.id) : null;
  const captain = team.players.find((p) => p.captain);
  const minRoster = tournament?.minRoster ?? 0;
  const missing = Math.max(0, minRoster - team.players.length);

  return (
    <>
      {passwordNotice}
      <header className="cl-sectionhead">
        <span className="cl-sectionhead__over">Přehled</span>
        <h1 style={headingStyle}>{team.name}</h1>
        <p className="cl-sectionhead__sub">
          {team.city}
          {team.foundedYear ? ` · založeno ${team.foundedYear}` : ""}
          {team.colors ? ` · ${team.colors}` : ""}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
        {tournament && entry && (
          <span className={entry.status === "approved" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
            {ENTRY_STATUS_LABEL[entry.status]}
          </span>
        )}
        <span className="roster-row__meta" style={{ color: "var(--text-muted)" }}>
          {tournament && entry ? `${tournament.name} · ` : ""}Kód týmu{" "}
          <span className="cl-num">{team.code}</span>
        </span>
      </div>

      <dl className="hist-timeline__stats">
        <div className={`cl-stat${missing > 0 ? " cl-stat--accent" : ""}`}>
          <dt className="cl-stat__label">Na soupisce</dt>
          <dd className="cl-stat__val order-first">
            {team.players.length} {plural(team.players.length, PLAYERS_NOM)}
          </dd>
        </div>
        <div className="cl-stat">
          <dt className="cl-stat__label">Kapitán na hřišti</dt>
          <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
            {captain ? `${captain.firstName} ${captain.lastName}` : "Neurčen"}
          </dd>
        </div>
      </dl>

      {tournament && !entry && (
        <Notice tone="accent">
          Tým zatím není přihlášený na {tournament.name}.{" "}
          <Link href={PATHS.teamRegistration} style={{ color: "var(--text-link)" }}>
            Přihlásit tým
          </Link>
        </Notice>
      )}

      {entry && missing > 0 && (
        <Notice tone="accent">
          Na turnaj potřebuješ aspoň {minRoster} {plural(minRoster, PLAYERS_ACC)}. Chybí ještě{" "}
          {missing} {plural(missing, PLAYERS_NOM)}.
        </Notice>
      )}

      {entry?.status === "pending" && (
        <Notice tone="info">
          Přihláška čeká na schválení organizátorem. Soupisku můžeš mezitím dál upravovat.
        </Notice>
      )}

      <div className="flex flex-wrap gap-[var(--sp-3)]">
        <Link href="/portal/hraci" className="cl-btn cl-btn--primary">
          <Users size={16} strokeWidth={2} aria-hidden />
          <span>Spravovat hráče</span>
        </Link>
        <Link href="/portal/tym" className="cl-btn cl-btn--ghost">
          <span>Upravit údaje týmu</span>
          <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </>
  );
}
