import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SplitText from "@/components/ui/SplitText";
import Awards from "@/components/tournaments/Awards";
import CardsTable from "@/components/tournaments/CardsTable";
import FinalStandings from "@/components/tournaments/FinalStandings";
import Podium from "@/components/tournaments/Podium";
import ResultsTable from "@/components/tournaments/ResultsTable";
import ScorersTable from "@/components/tournaments/ScorersTable";
import StandingsTable from "@/components/tournaments/StandingsTable";
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
}: PageProps<"/turnaje/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await getTournament(slug);
  if (!tournament) return { title: "Turnaj nenalezen | Clutch League" };

  return {
    title: `${tournament.name} ${tournament.dateLabel} | Clutch League`,
    description: tournament.summary,
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

export default async function TurnajDetail({ params }: PageProps<"/turnaje/[slug]">) {
  const { slug } = await params;
  const tournament = await getTournament(slug);
  if (!tournament) notFound();

  const champion = winner(tournament);
  const stats = tournamentSummaryStats(tournament);
  const tables = buildTables(tournament);

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container flex flex-col gap-[var(--sp-12)]">
        <div>
          <Link href="/turnaje" className="cl-btn cl-btn--ghost cl-btn--sm cl-back">
            <ArrowLeft size={16} strokeWidth={2} aria-hidden />
            <span>Všechny turnaje</span>
          </Link>
        </div>

        {/* ---- hlavička ---- */}
        <header className="flex flex-col gap-[var(--sp-6)]">
          <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
            {tournament.edition && <span className="cl-badge">{tournament.edition}</span>}
            <span className="cl-badge cl-badge--neutral">Odehráno</span>
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
            <p className="cl-sectionhead__sub">{tournament.summary}</p>
          </div>

          <dl className="hist-timeline__stats">
            <div className="cl-stat">
              <dt className="cl-stat__label">Datum</dt>
              <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
                {tournament.dateLabel}
              </dd>
            </div>
            {tournament.venue && (
              <div className="cl-stat">
                <dt className="cl-stat__label">Místo</dt>
                <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
                  {tournament.venue}
                </dd>
              </div>
            )}
            {tournament.format && (
              <div className="cl-stat">
                <dt className="cl-stat__label">Formát</dt>
                <dd className="cl-stat__val order-first">{tournament.format}</dd>
              </div>
            )}
            <div className="cl-stat">
              <dt className="cl-stat__label">Týmů</dt>
              <dd className="cl-stat__val order-first">{stats.teams}</dd>
            </div>
            <div className="cl-stat">
              <dt className="cl-stat__label">Zápasů</dt>
              <dd className="cl-stat__val order-first">{stats.matches}</dd>
            </div>
            <div className="cl-stat cl-stat--accent">
              <dt className="cl-stat__label">Gólů na zápas</dt>
              <dd className="cl-stat__val order-first">{stats.goalsPerMatch}</dd>
            </div>
            {stats.yellowCards + stats.redCards > 0 && (
              <div className="cl-stat">
                <dt className="cl-stat__label">Žluté / červené</dt>
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
                  alt={tournament.photo.alt}
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
              <span className="cl-sectionhead__over">Výsledek</span>
              <h2 id="vitez" style={sectionTitle}>
                Turnaj vyhrál {champion.name}
              </h2>
            </div>
            <Podium tournament={tournament} />
          </section>
        )}

        {/* ---- individuální ocenění ---- */}
        {(tournament.scorers.length > 0 || tournament.mvp || tournament.bestKeeper) && (
          <section aria-labelledby="oceneni" className="flex flex-col gap-[var(--sp-6)]">
            <div className="cl-sectionhead">
              <span className="cl-sectionhead__over">Ocenění</span>
              <h2 id="oceneni" style={sectionTitle}>
                Nejlepší jednotlivci
              </h2>
            </div>
            <Awards tournament={tournament} />
          </section>
        )}

        {/* ---- tabulky skupin ---- */}
        <section aria-labelledby="tabulka" className="flex flex-col gap-[var(--sp-6)]">
          <div className="cl-sectionhead">
            <span className="cl-sectionhead__over">Tabulka</span>
            <h2 id="tabulka" style={sectionTitle}>
              Skupinová fáze
            </h2>
            <p className="cl-sectionhead__sub">
              Tabulka se počítá přímo ze zadaných výsledků. Výhra 3 body, remíza 1 bod.
            </p>
          </div>
          <div className="cl-card">
            <div className="cl-card__in">
              <div className="cl-card__body">
                <StandingsTable tables={tables} />
              </div>
            </div>
          </div>
        </section>

        {/* ---- střelci a karty ---- */}
        {(tournament.scorers.length > 0 || tournament.cards.length > 0) && (
          <section aria-labelledby="strelci" className="flex flex-col gap-[var(--sp-6)]">
            <div className="cl-sectionhead">
              <span className="cl-sectionhead__over">Statistiky</span>
              <h2 id="strelci" style={sectionTitle}>
                {tournament.cards.length > 0 ? "Střelci a karty" : "Střelci"}
              </h2>
              {tournament.scorersFromMatches && (
                <p className="cl-sectionhead__sub">Spočítáno z gólů a karet zapsaných u jednotlivých zápasů.</p>
              )}
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
        <section aria-labelledby="vysledky" className="flex flex-col gap-[var(--sp-6)]">
          <div className="cl-sectionhead">
            <span className="cl-sectionhead__over">Zápasy</span>
            <h2 id="vysledky" style={sectionTitle}>
              Kompletní výsledky
            </h2>
            <p className="cl-sectionhead__sub">
              Všech {stats.matches} zápasů turnaje, od skupin po finále
              {tournament.matches.some((m) => m.events.length > 0) ? " — se střelci a kartami." : "."}
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

        {/* ---- konečné pořadí ---- */}
        {tournament.finalRanking.length > 0 && (
          <section aria-labelledby="poradi" className="flex flex-col gap-[var(--sp-6)]">
            <div className="cl-sectionhead">
              <span className="cl-sectionhead__over">Pořadí</span>
              <h2 id="poradi" style={sectionTitle}>
                Konečné pořadí
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
