import { ArrowRight } from "lucide-react";
import TournamentCard from "@/components/tournaments/TournamentCard";
import Notice from "@/components/ui/Notice";
import SplitText from "@/components/ui/SplitText";
import Link from "@/i18n/Link";
import { getDictionary } from "@/i18n/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTournaments, tournamentSummaryStats, type Tournament } from "@/lib/tournaments";

/** Kolik posledních turnajů ukázat na úvodní stránce. Zbytek je na /turnaje. */
const LATEST_COUNT = 3;

type Loaded = { latest: Tournament[]; total: number; matches: number; goals: number } | null;

/** Odehrané turnaje z databáze. Bez databáze nebo při chybě vrací null. */
async function loadPlayed(): Promise<Loaded> {
  if (!isSupabaseConfigured()) return null;
  try {
    const tournaments = await getTournaments(); // od nejnovějšího
    const totals = tournaments.map(tournamentSummaryStats);
    return {
      latest: tournaments.slice(0, LATEST_COUNT),
      total: tournaments.length,
      matches: totals.reduce((sum, t) => sum + t.matches, 0),
      goals: totals.reduce((sum, t) => sum + t.goals, 0),
    };
  } catch (error) {
    console.error("[odehrané zápasy] turnaje se nenačetly", error);
    return null;
  }
}

/**
 * „Odehrané zápasy“ na úvodní stránce: posledních pár turnajů jako karty a
 * odkaz na celý archiv. Veřejné pro všechny — bez přihlášení i kontroly rolí.
 */
export default async function PlayedTournamentsSection() {
  const [played, dict] = await Promise.all([loadPlayed(), getDictionary()]);
  const t = dict.played;

  return (
    <section
      id="odehrane-zapasy"
      aria-labelledby="odehrane-zapasy-title"
      className="cl-section border-t border-[var(--border-subtle)]"
    >
      <div className="cl-container flex flex-col gap-[var(--sp-10)]">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.over}</span>
          <SplitText
            tag="h2"
            id="odehrane-zapasy-title"
            className="cl-sectionhead__title"
            text={t.title}
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">{t.sub}</p>
        </div>

        {played && played.latest.length > 0 ? (
          <>
            <dl className="hist-timeline__stats">
              <div className="cl-stat cl-stat--accent">
                <dt className="cl-stat__label">{t.tournaments}</dt>
                <dd className="cl-stat__val order-first">{played.total}</dd>
              </div>
              {/* Bez zapsaných zápasů by tu byly jen nuly. */}
              {played.matches > 0 && (
                <>
                  <div className="cl-stat">
                    <dt className="cl-stat__label">{t.matches}</dt>
                    <dd className="cl-stat__val order-first">{played.matches}</dd>
                  </div>
                  <div className="cl-stat">
                    <dt className="cl-stat__label">{t.goals}</dt>
                    <dd className="cl-stat__val order-first">{played.goals}</dd>
                  </div>
                </>
              )}
            </dl>

            <ol className="trn-grid" aria-label={t.listLabel}>
              {played.latest.map((tournament) => (
                <TournamentCard key={tournament.slug} tournament={tournament} />
              ))}
            </ol>

            <div>
              <Link href="/turnaje" className="cl-btn cl-btn--secondary">
                <span>{t.all}</span>
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </>
        ) : (
          <Notice tone="info">{t.empty}</Notice>
        )}
      </div>
    </section>
  );
}
