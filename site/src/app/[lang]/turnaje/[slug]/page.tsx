import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Awards from "@/components/tournaments/Awards";
import CardsTable from "@/components/tournaments/CardsTable";
import FinalStandings from "@/components/tournaments/FinalStandings";
import Podium from "@/components/tournaments/Podium";
import ResultsTable from "@/components/tournaments/ResultsTable";
import ScorersTable from "@/components/tournaments/ScorersTable";
import StandingsTable from "@/components/tournaments/StandingsTable";
import { czechOnly, editionLabel, formatLabel } from "@/i18n/data";
import { fmt, formatDecimal, plural } from "@/i18n/format";
import { getI18n, pageTitle } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { buildTables, getTournament, tournamentSummaryStats, winner } from "@/lib/tournaments";

// Detaily se vyrenderují při první návštěvě a pak se cachují (ISR) — build
// tak nepotřebuje přístup k databázi. Po 5 minutách, nebo hned po zápisu
// výsledku organizátorem, se přegenerují.
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/turnaje/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [{ locale, t }, tournament] = await Promise.all([getI18n(), getTournament(slug)]);
  if (!tournament) return { title: pageTitle(t, t.tournament.notFound) };

  return {
    title: pageTitle(t, `${tournament.name} ${formatDate(tournament.dateIso, locale)}`),
    description: czechOnly(tournament.summary, locale) || t.archive.metaDescription,
  };
}

const sectionTitle = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-display)",
  fontStyle: "italic",
  fontSize: "var(--fs-h3)",
  lineHeight: "var(--lh-heading)",
  letterSpacing: "var(--ls-display)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
} as const;

export default async function TurnajDetail({ params }: PageProps<"/[lang]/turnaje/[slug]">) {
  const { slug } = await params;
  const [{ locale, t: dict }, tournament] = await Promise.all([getI18n(), getTournament(slug)]);
  if (!tournament) notFound();
  const t = dict.tournament;

  const champion = winner(tournament);
  const stats = tournamentSummaryStats(tournament);
  const tables = buildTables(tournament);
  // Starší turnaje můžou mít jen týmy a pořadí, bez zapsaných zápasů. Pak se
  // statistiky, tabulka ani výsledky neukazují (žádné nuly ani prázdné tabulky).
  const hasMatches = tournament.matches.length > 0;
  const hasTable = tournament.matches.some((m) => m.countsForTable);

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container flex flex-col gap-[var(--sp-12)]">
        <div>
          {/* Zpět tam, odkud návštěvník přišel (úvodní stránka nebo archiv). */}
          <BackButton fallback="/#odehrane-zapasy" />
        </div>

        {/* ---- hlavička ---- */}
        <header className="flex flex-col gap-[var(--sp-6)]">
          <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
            {tournament.edition && <span className="cl-badge">{editionLabel(tournament.edition, dict)}</span>}
            <span className="cl-badge cl-badge--neutral">{t.completed}</span>
          </div>

          <div className="cl-sectionhead">
            <SplitText
              tag="h1"
              className="cl-display"
              style={{
                fontSize: "var(--fs-h1)",
                fontStyle: "italic",
                lineHeight: "var(--lh-heading)",
              }}
              text={tournament.name}
              textAlign="left"
            />
          </div>

          <dl className="hist-timeline__stats">
            <div className="cl-stat">
              <dt className="cl-stat__label">{t.date}</dt>
              <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
                {formatDate(tournament.dateIso, locale)}
              </dd>
            </div>
            {tournament.venue && (
              <div className="cl-stat">
                <dt className="cl-stat__label">{t.venue}</dt>
                <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
                  {tournament.venue}
                </dd>
              </div>
            )}
            {tournament.format && (
              <div className="cl-stat">
                <dt className="cl-stat__label">{t.format}</dt>
                <dd className="cl-stat__val order-first">{formatLabel(tournament.format, locale)}</dd>
              </div>
            )}
            <div className="cl-stat">
              <dt className="cl-stat__label">{t.teams}</dt>
              <dd className="cl-stat__val order-first">{stats.teams}</dd>
            </div>
            {hasMatches && (
              <>
                <div className="cl-stat">
                  <dt className="cl-stat__label">{t.matches}</dt>
                  <dd className="cl-stat__val order-first">{stats.matches}</dd>
                </div>
                <div className="cl-stat cl-stat--accent">
                  <dt className="cl-stat__label">{t.goalsPerMatch}</dt>
                  <dd className="cl-stat__val order-first">{formatDecimal(locale, stats.goalsPerMatch)}</dd>
                </div>
              </>
            )}
            {stats.yellowCards + stats.redCards > 0 && (
              <div className="cl-stat">
                <dt className="cl-stat__label">{t.cards}</dt>
                <dd className="cl-stat__val order-first">
                  {stats.yellowCards} / {stats.redCards}
                </dd>
              </div>
            )}
          </dl>

          {tournament.photo && (
            <div className="cl-frame">
              <div className="cl-frame-in relative aspect-[16/7] overflow-hidden">
                <Image
                  src={tournament.photo.src}
                  alt={czechOnly(tournament.photo.alt, locale) || tournament.name}
                  fill
                  sizes="(max-width: 1240px) 100vw, 1240px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}
        </header>

        {/* ---- vítěz a medaile (až organizátor zadá konečné pořadí) ---- */}
        {champion && (
          <section aria-labelledby="vitez" className="flex flex-col gap-[var(--sp-6)]">
            <div className="cl-sectionhead">
              <span className="cl-sectionhead__over">{t.resultOver}</span>
              <h2 id="vitez" style={sectionTitle}>
                {fmt(t.winner, { team: champion.name })}
              </h2>
            </div>
            <Podium tournament={tournament} />
          </section>
        )}

        {/* ---- individuální ocenění ---- */}
        {(tournament.scorers.length > 0 || tournament.mvp || tournament.bestKeeper) && (
          <section aria-labelledby="oceneni" className="flex flex-col gap-[var(--sp-6)]">
            <div className="cl-sectionhead">
              <span className="cl-sectionhead__over">{t.awardsOver}</span>
              <h2 id="oceneni" style={sectionTitle}>
                {t.awardsTitle}
              </h2>
            </div>
            <Awards tournament={tournament} />
          </section>
        )}

        {/* ---- tabulky skupin ---- */}
        {hasTable && (
          <section aria-labelledby="tabulka" className="flex flex-col gap-[var(--sp-6)]">
            <div className="cl-sectionhead">
              <span className="cl-sectionhead__over">{t.tableOver}</span>
              <h2 id="tabulka" style={sectionTitle}>
                {t.tableTitle}
              </h2>
              <p className="cl-sectionhead__sub">{t.tableSub}</p>
            </div>
            <div className="cl-card">
              <div className="cl-card__in">
                <div className="cl-card__body">
                  <StandingsTable tables={tables} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---- střelci a karty ---- */}
        {(tournament.scorers.length > 0 || tournament.cards.length > 0) && (
          <section aria-labelledby="strelci" className="flex flex-col gap-[var(--sp-6)]">
            <div className="cl-sectionhead">
              <span className="cl-sectionhead__over">{t.statsOver}</span>
              <h2 id="strelci" style={sectionTitle}>
                {tournament.cards.length > 0 ? t.scorersAndCards : t.scorers}
              </h2>
              {tournament.scorersFromMatches && <p className="cl-sectionhead__sub">{t.statsSub}</p>}
            </div>
            <div className="cl-card">
              <div className="cl-card__in">
                <div className="cl-card__body flex flex-col gap-[var(--sp-8)]">
                  {tournament.scorers.length > 0 && <ScorersTable tournament={tournament} />}
                  {tournament.cards.length > 0 && <CardsTable tournament={tournament} />}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---- kompletní výsledky ---- */}
        {hasMatches && (
          <section aria-labelledby="vysledky" className="flex flex-col gap-[var(--sp-6)]">
            <div className="cl-sectionhead">
              <span className="cl-sectionhead__over">{t.matchesOver}</span>
              <h2 id="vysledky" style={sectionTitle}>
                {t.resultsTitle}
              </h2>
              <p className="cl-sectionhead__sub">
                {plural(locale, stats.matches, t.resultsCount)}
                {tournament.matches.some((m) => m.events.length > 0) ? t.resultsSuffixEvents : t.resultsSuffix}
              </p>
            </div>
            <div className="cl-card">
              <div className="cl-card__in">
                <div className="cl-card__body">
                  <ResultsTable tournament={tournament} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---- konečné pořadí (i týmy bez umístění) ---- */}
        {tournament.teams.length > 0 && (
          <section aria-labelledby="poradi" className="flex flex-col gap-[var(--sp-6)]">
            <div className="cl-sectionhead">
              <span className="cl-sectionhead__over">{t.standingsOver}</span>
              <h2 id="poradi" style={sectionTitle}>
                {t.standingsTitle}
              </h2>
            </div>
            <div className="cl-card">
              <div className="cl-card__in">
                <div className="cl-card__body">
                  <FinalStandings tournament={tournament} />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
