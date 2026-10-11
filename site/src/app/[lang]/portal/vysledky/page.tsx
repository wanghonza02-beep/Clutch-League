import type { Metadata } from "next";
import { ClipboardPen, ExternalLink } from "lucide-react";
import PortalHeader from "@/components/portal/PortalHeader";
import EntryRankingForm from "@/components/admin/EntryRankingForm";
import { SelectField } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import type { Locale } from "@/i18n/config";
import { stageLabel } from "@/i18n/data";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import { rich } from "@/i18n/rich";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { getResultsOverview, listTournaments, type ResultMatchRow } from "@/lib/admin/data";
import { matchPoints } from "@/lib/admin/result";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.resultsMetaTitle) };
}

function MatchItem({ match, locale, dict }: { match: ResultMatchRow; locale: Locale; dict: Dictionary }) {
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
          href={`/portal/vysledky/${match.id}`}
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

export default async function PortalVysledky({ searchParams }: PageProps<"/[lang]/portal/vysledky">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const { turnaj } = await searchParams;
  const tournaments = await listTournaments();

  // Bez výběru: nejbližší nadcházející turnaj (výsledky se zapisují v den
  // turnaje), jinak poslední odehraný.
  const upcoming = tournaments.filter((tr) => tr.status === "upcoming").at(-1);
  const selectedId =
    (typeof turnaj === "string" && tournaments.some((tr) => tr.id === turnaj) ? turnaj : undefined) ??
    upcoming?.id ??
    tournaments[0]?.id;
  const data = selectedId ? await getResultsOverview(selectedId) : null;

  // Zápasy po fázích ve stejném pořadí, v jakém se hrají.
  const stages = new Map<string, ResultMatchRow[]>();
  for (const m of data?.matches ?? []) stages.set(m.stage, [...(stages.get(m.stage) ?? []), m]);
  const done = data?.matches.filter((m) => m.homeGoals !== null).length ?? 0;

  return (
    <>
      <PortalHeader over={t.over} title={t.resultsTitle} sub={t.resultsSub} />

      {!data ? (
        <Notice tone="info">{fmt(t.resultsNoTournament, { link: t.resultsNoTournamentLink })}</Notice>
      ) : (
        <>
          {tournaments.length > 1 && (
            <form method="get" className="res-picker" aria-label={t.pickerLabel}>
              <SelectField id="res-turnaj" name="turnaj" label={t.tournament} defaultValue={data.tournament.id}>
                {tournaments.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.name} ({formatDate(tr.startsOn, locale)})
                  </option>
                ))}
              </SelectField>
              <button type="submit" className="cl-btn cl-btn--secondary">
                <span>{t.show}</span>
              </button>
            </form>
          )}

          {/* ---- zápasy ---- */}
          <section aria-labelledby="vys-zapasy" className="flex flex-col gap-[var(--sp-5)]">
            <div className="flex flex-col gap-[var(--sp-2)]">
              <h2 id="vys-zapasy" className="portal-h2">
                {data.tournament.name}
              </h2>
              <p className="adm-meta" style={{ margin: 0 }}>
                <span className="cl-num">{formatDate(data.tournament.starts_on, locale)}</span>
                <span>{fmt(t.written, { done, total: data.matches.length })}</span>
                {data.matches.length > 0 && (
                  <Link href={`/portal/turnaje/${data.tournament.id}#zapasy`}>{t.editSchedule}</Link>
                )}
                {data.tournament.status === "completed" && (
                  <Link href={`/turnaje/${data.tournament.slug}`}>
                    {t.publicPage}{" "}
                    <ExternalLink size={12} strokeWidth={2} aria-hidden style={{ display: "inline" }} />
                  </Link>
                )}
              </p>
            </div>

            {data.matches.length === 0 ? (
              <Notice tone="accent">
                {rich(t.noMatches, {
                  link: <Link href={`/portal/turnaje/${data.tournament.id}#zapasy`}>{t.noMatchesLink}</Link>,
                })}
              </Notice>
            ) : (
              [...stages].map(([stage, list]) => (
                <div key={stage} className="flex flex-col gap-[var(--sp-3)]">
                  <h3 className="adm-sub">{stageLabel(stage, dict)}</h3>
                  <div className="cl-card">
                    <div className="cl-card__in">
                      <ul className="cl-card__body" aria-label={fmt(t.stageMatches, { stage: stageLabel(stage, dict) })}>
                        {list.map((m) => (
                          <MatchItem key={m.id} match={m} locale={locale} dict={dict} />
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* ---- umístění a postup ---- */}
          <section aria-labelledby="vys-poradi" className="flex flex-col gap-[var(--sp-5)]">
            <h2 id="vys-poradi" className="portal-h2">
              {t.rankingTitle}
            </h2>
            <p className="cl-sectionhead__sub" style={{ margin: 0 }}>
              {t.rankingSub}
            </p>
            {data.entries.length === 0 ? (
              <Notice tone="info">{t.noTeams}</Notice>
            ) : (
              <div className="cl-card">
                <div className="cl-card__in">
                  <ul className="cl-card__body" aria-label={t.rankingLabel}>
                    {data.entries.map((e) => (
                      <EntryRankingForm key={e.teamId} tournamentId={data.tournament.id} entry={e} />
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
