import type { Metadata } from "next";
import { Send } from "lucide-react";
import PortalHeader from "@/components/portal/PortalHeader";
import Notice from "@/components/ui/Notice";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { getAdminOverview } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";
import { getCaptainTeam, getOpenTournament, getTeamEntry } from "@/lib/portal/data";
import { PATHS } from "@/lib/portal/paths";
import { requireUser } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.portal.overviewMetaTitle) };
}

/**
 * Přehled ukazuje stav a co je potřeba udělat. Na sekce portálu vede lišta —
 * tady jsou jen odkazy na konkrétní věc (turnaj) nebo na další krok, který
 * v liště není (přihláška týmu).
 */
export default async function PortalPrehled({ searchParams }: PageProps<"/[lang]/portal">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.portal;
  const user = await requireUser(locale);
  const passwordChanged = (await searchParams).heslo === "zmeneno";

  const passwordNotice = passwordChanged && (
    <Notice tone="ok" live>
      {t.passwordChanged}
    </Notice>
  );

  if (user.role === "admin") {
    const overview = await getAdminOverview();

    return (
      <>
        {passwordNotice}
        <PortalHeader over={t.adminOver} title={fmt(t.adminHello, { name: user.name })} sub={t.adminSub} />

        <dl className="hist-timeline__stats">
          <div className={`cl-stat${overview.pendingEntries > 0 ? " cl-stat--accent" : ""}`}>
            <dt className="cl-stat__label">{t.pendingStat}</dt>
            <dd className="cl-stat__val order-first">{overview.pendingEntries}</dd>
          </div>
          <div className="cl-stat">
            <dt className="cl-stat__label">{t.usersStat}</dt>
            <dd className="cl-stat__val order-first">{overview.users}</dd>
          </div>
        </dl>

        {overview.pendingEntries > 0 && (
          <Notice tone="accent">{plural(locale, overview.pendingEntries, t.pendingNotice)}</Notice>
        )}

        {overview.upcoming.length === 0 ? (
          <Notice tone="info">{t.noUpcoming}</Notice>
        ) : (
          <section aria-labelledby="nadchazejici" className="flex flex-col gap-[var(--sp-4)]">
            <h2 id="nadchazejici" className="adm-sub">
              {t.upcomingLabel}
            </h2>
            <ul className="flex flex-col gap-[var(--sp-3)]">
              {overview.upcoming.map((tournament) => (
                <li key={tournament.id} className="flex flex-wrap items-center gap-[var(--sp-2)_var(--sp-4)]">
                  <Link href={`/portal/turnaje/${tournament.id}`} className="adm-item__title">
                    {tournament.name}
                  </Link>
                  <span className="roster-row__meta cl-num">{formatDate(tournament.startsOn, locale)}</span>
                  <span className={tournament.registrationOpen ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                    {tournament.registrationOpen ? t.registrationOpen : t.registrationClosed}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </>
    );
  }

  const [team, tournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);

  // Kapitán bez týmu: tým vzniká jen přes přihlášku, ne v portálu. Přihláška
  // v liště není, tak je tu jako jediný další krok.
  if (!team) {
    return (
      <>
        {passwordNotice}
        <PortalHeader
          over={t.overviewOver}
          title={fmt(t.welcome, { name: user.name })}
          sub={tournament ? fmt(t.noTeamOpen, { tournament: tournament.name }) : t.noTeamClosed}
        />

        {tournament && (
          <div>
            <Link href={PATHS.teamRegistration} className="cl-btn cl-btn--primary cl-btn--lg">
              <Send size={18} strokeWidth={2} aria-hidden />
              <span>{dict.common.registerTeam}</span>
            </Link>
          </div>
        )}
      </>
    );
  }

  const entry = tournament ? await getTeamEntry(team.id, tournament.id) : null;
  const captain = team.players.find((p) => p.captain);
  const count = team.players.length;
  const minRoster = tournament?.minRoster ?? 0;
  const missing = Math.max(0, minRoster - count);
  const overMax = tournament ? count > tournament.maxRoster : false;

  return (
    <>
      {passwordNotice}
      <PortalHeader
        over={t.overviewOver}
        title={team.name}
        sub={[
          team.city,
          team.foundedYear ? fmt(t.founded, { year: team.foundedYear }).replace(/^ · /, "") : "",
          team.colors,
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
        {tournament && entry && (
          <span className={entry.status === "approved" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
            {dict.labels.entryStatus[entry.status]}
          </span>
        )}
        <span className="roster-row__meta" style={{ color: "var(--text-muted)" }}>
          {tournament && entry ? `${tournament.name} · ` : ""}
          {t.teamCode} <span className="cl-num">{team.code}</span>
        </span>
      </div>

      <dl className="hist-timeline__stats">
        <div className={`cl-stat${missing > 0 || overMax ? " cl-stat--accent" : ""}`}>
          <dt className="cl-stat__label">{t.onRoster}</dt>
          <dd className="cl-stat__val order-first">{plural(locale, count, dict.counts.players)}</dd>
        </div>
        <div className="cl-stat">
          <dt className="cl-stat__label">{t.fieldCaptain}</dt>
          <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
            {captain ? `${captain.firstName} ${captain.lastName}` : t.noCaptain}
          </dd>
        </div>
      </dl>

      {tournament && !entry && (
        <Notice tone="accent">
          {fmt(t.notEntered, { tournament: tournament.name })}{" "}
          <Link href={PATHS.teamRegistration} style={{ color: "var(--text-link)" }}>
            {dict.common.registerTeam}
          </Link>
        </Notice>
      )}

      {entry && missing > 0 && (
        <Notice tone="accent">
          {fmt(t.missingPlayers, {
            min: plural(locale, minRoster, dict.counts.playersAcc),
            missing: plural(locale, missing, dict.counts.playersAcc),
          })}
        </Notice>
      )}

      {entry && tournament && overMax && (
        <Notice tone="accent">
          {fmt(t.tooManyPlayers, {
            max: plural(locale, tournament.maxRoster, dict.counts.playersAcc),
            count,
          })}
        </Notice>
      )}

      {entry?.status === "pending" && <Notice tone="info">{t.pendingEntry}</Notice>}
    </>
  );
}
