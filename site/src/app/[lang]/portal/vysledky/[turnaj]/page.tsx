import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CalendarPlus, ClipboardPen, ExternalLink } from "lucide-react";
import BackButton from "@/components/BackButton";
import PortalHeader from "@/components/portal/PortalHeader";
import TeamResultCard from "@/components/admin/TeamResultCard";
import Notice from "@/components/ui/Notice";
import type { Locale } from "@/i18n/config";
import { stageLabel } from "@/i18n/data";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, localeHref, portalTitle } from "@/i18n/server";
import { getMatchForResult, getResultsOverview, type ResultMatchRow } from "@/lib/admin/data";
import { matchPoints } from "@/lib/admin/result";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";
import { isPublished } from "@/lib/tournamentModel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.resultsMetaTitle) };
}

function MatchItem({
  match,
  tournamentId,
  locale,
  dict,
}: {
  match: ResultMatchRow;
  tournamentId: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.admin;
  const played = match.homeGoals !== null && match.awayGoals !== null;
  const points = played ? matchPoints(match.homeGoals!, match.awayGoals!) : null;
  return (
    <li className="adm-item" style={{ gap: "var(--sp-2)" }}>
      <div className="adm-item__head">
        <span className="adm-item__title">
          {match.homeTeam} <span aria-hidden>–</span>
          <span className="sr-only"> {dict.common.versus} </span> {match.awayTeam}
        </span>
        <span className={played ? "cl-badge" : "cl-badge cl-badge--neutral"}>
          {played ? <span className="cl-num">{`${match.homeGoals}:${match.awayGoals}`}</span> : t.noResult}
        </span>
        <Link
          href={`/portal/vysledky/${tournamentId}/${match.id}`}
          className={`cl-btn cl-btn--sm ${played ? "cl-btn--ghost" : "cl-btn--secondary"}`}
          style={{ marginLeft: "auto" }}
        >
          <ClipboardPen size={14} strokeWidth={2} aria-hidden />
          <span>{played ? t.edit : t.writeResult}</span>
        </Link>
      </div>
      <div className="adm-meta">
        <span className="cl-num">{formatDateTime(match.kickoff, locale)}</span>
        {points && <span className="cl-num">{fmt(t.points, { points: `${points[0]}:${points[1]}` })}</span>}
        {played && (
          <span>
            {match.goals ? plural(locale, match.goals, t.namedGoals) : t.noScorers}
            {match.cards > 0 && ` · ${plural(locale, match.cards, t.cardsCount)}`}
          </span>
        )}
        {match.clutchMode && <span>{fmt(t.clutchMode, { mode: match.clutchMode })}</span>}
      </div>
    </li>
  );
}

/**
 * Zápasy a výsledky jednoho turnaje (karta v sekci Zapsat výsledky): zápasy
 * po fázích s odkazem na zápis výsledku a pod nimi karta každého schváleného
 * týmu s umístěním, postupem a statistikami hráčů.
 */
export default async function VysledkyTurnaje({ params }: PageProps<"/[lang]/portal/vysledky/[turnaj]">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const { turnaj } = await params;
  const data = await getResultsOverview(turnaj);
  if (!data) {
    // Starší odkaz /portal/vysledky/<id zápasu> vede na novou adresu zápasu.
    const match = await getMatchForResult(turnaj);
    if (match) redirect(await localeHref(`/portal/vysledky/${match.tournament.id}/${match.id}`));
    notFound();
  }

  // Zápasy po fázích ve stejném pořadí, v jakém se hrají.
  const stages = new Map<string, ResultMatchRow[]>();
  for (const m of data.matches) stages.set(m.stage, [...(stages.get(m.stage) ?? []), m]);
  const done = data.matches.filter((m) => m.homeGoals !== null).length;

  return (
    <>
      <div>
        <BackButton fallback="/portal/vysledky" />
      </div>
      <PortalHeader over={dict.portalNav.results} title={data.tournament.name} />
      <p className="adm-meta" style={{ margin: 0 }}>
        <span className="cl-num">{formatDate(data.tournament.starts_on, locale)}</span>
        {data.matches.length > 0 && <span>{fmt(t.written, { done, total: data.matches.length })}</span>}
        {data.tournament.status === "completed" && isPublished(data.tournament) && (
          <Link href={`/turnaje/${data.tournament.slug}`}>
            {t.publicPage} <ExternalLink size={12} strokeWidth={2} aria-hidden style={{ display: "inline" }} />
          </Link>
        )}
      </p>

      {/* ---- zápasy ---- */}
      <section aria-labelledby="vys-zapasy" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="vys-zapasy" className="portal-h2">
          {t.matchesTitle}
        </h2>
        {data.matches.length === 0 ? (
          // Jediné místo mimo boční panel, odkud vede cesta do Rozpisu turnajů:
          // rovnou k zápasům tohohle turnaje. Zmizí, jakmile má turnaj zápas.
          <Notice tone="accent">
            <span className="flex flex-col items-start gap-[var(--sp-3)]">
              <span>{t.noMatches}</span>
              <Link href={`/portal/turnaje/${data.tournament.id}#zapasy`} className="cl-btn cl-btn--secondary cl-btn--sm">
                <CalendarPlus size={14} strokeWidth={2} aria-hidden />
                <span>{t.noMatchesButton}</span>
              </Link>
            </span>
          </Notice>
        ) : (
          [...stages].map(([stage, list]) => (
            <div key={stage} className="flex flex-col gap-[var(--sp-3)]">
              <h3 className="adm-sub">{stageLabel(stage, dict)}</h3>
              <div className="cl-card">
                <div className="cl-card__in">
                  <ul className="cl-card__body" aria-label={fmt(t.stageMatches, { stage: stageLabel(stage, dict) })}>
                    {list.map((m) => (
                      <MatchItem key={m.id} match={m} tournamentId={data.tournament.id} locale={locale} dict={dict} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ---- týmy: umístění, postup a statistiky hráčů ---- */}
      <section aria-labelledby="vys-tymy" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="vys-tymy" className="portal-h2">
          {t.teamsResultsTitle}
        </h2>
        {data.teams.length === 0 ? (
          <Notice tone="info">{t.noApprovedTeams}</Notice>
        ) : (
          <ul className="tcards" aria-label={t.teamsResultsTitle}>
            {data.teams.map((team) => (
              <TeamResultCard
                key={team.teamId}
                tournamentId={data.tournament.id}
                team={team}
                statsReady={data.statsReady}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
