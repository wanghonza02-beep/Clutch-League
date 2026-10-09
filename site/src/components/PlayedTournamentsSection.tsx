import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TournamentCard from "@/components/tournaments/TournamentCard";
import Notice from "@/components/ui/Notice";
import SplitText from "@/components/ui/SplitText";
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
  const played = await loadPlayed();

  return (
    <section
      id="odehrane-zapasy"
      aria-labelledby="odehrane-zapasy-title"
      className="cl-section border-t border-[var(--border-subtle)]"
    >
      <div className="cl-container flex flex-col gap-[var(--sp-10)]">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">Výsledky</span>
          <SplitText
            tag="h2"
            id="odehrane-zapasy-title"
            className="cl-sectionhead__title"
            text="Odehrané zápasy"
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">
            Poslední turnaje Clutch League. Klikni na turnaj a uvidíš konečné pořadí, tabulky,
            střelce i všechny výsledky.
          </p>
        </div>

        {played && played.latest.length > 0 ? (
          <>
            <dl className="hist-timeline__stats">
              <div className="cl-stat cl-stat--accent">
                <dt className="cl-stat__label">Odehraných turnajů</dt>
                <dd className="cl-stat__val order-first">{played.total}</dd>
              </div>
              <div className="cl-stat">
                <dt className="cl-stat__label">Zápasů</dt>
                <dd className="cl-stat__val order-first">{played.matches}</dd>
              </div>
              <div className="cl-stat">
                <dt className="cl-stat__label">Gólů</dt>
                <dd className="cl-stat__val order-first">{played.goals}</dd>
              </div>
            </dl>

            <ol className="trn-grid" aria-label="Poslední odehrané turnaje">
              {played.latest.map((tournament) => (
                <TournamentCard key={tournament.slug} tournament={tournament} />
              ))}
            </ol>

            <div>
              <Link href="/turnaje" className="cl-btn cl-btn--secondary">
                <span>Všechny odehrané turnaje</span>
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </>
        ) : (
          <Notice tone="info">Výsledky odehraných turnajů sem brzy doplníme.</Notice>
        )}
      </div>
    </section>
  );
}
