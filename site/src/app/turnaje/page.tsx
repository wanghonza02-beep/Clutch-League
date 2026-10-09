import type { Metadata } from "next";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import TournamentCard from "@/components/tournaments/TournamentCard";
import { CAMPAIGN } from "@/content/campaign";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTournaments, getUpcomingTournament, tournamentSummaryStats } from "@/lib/tournaments";

export const metadata: Metadata = {
  title: "Odehrané turnaje | Clutch League",
  description:
    "Výsledky, konečné pořadí a střelci všech odehraných turnajů Clutch League.",
};

// Statická stránka, kterou Next po 5 minutách přegeneruje. Výsledek zapsaný
// organizátorem ji obnoví hned (revalidatePath v saveMatchResultAction).
export const revalidate = 300;

export default async function Turnaje() {
  const [tournaments, upcoming] = await Promise.all([getTournaments(), getUpcomingTournament()]);
  const totals = tournaments.map(tournamentSummaryStats);
  const totalMatches = totals.reduce((sum, s) => sum + s.matches, 0);
  const totalGoals = totals.reduce((sum, s) => sum + s.goals, 0);

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">Archiv</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{
              fontSize: "var(--fs-h1)",
              fontStyle: "italic",
              lineHeight: "var(--lh-heading)",
            }}
            text="Odehrané turnaje"
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">
            Každý turnaj má svoji stránku s konečným pořadím, tabulkou skupin, střelci a
            kompletními výsledky. Klikni na turnaj a koukni se, jak to dopadlo.
          </p>
        </div>

        {tournaments.length > 0 ? (
          <>
            <dl className="hist-timeline__stats">
              <div className="cl-stat cl-stat--accent">
                <dt className="cl-stat__label">Turnajů</dt>
                <dd className="cl-stat__val order-first">{tournaments.length}</dd>
              </div>
              {/* Bez zapsaných zápasů by tu byly jen nuly. */}
              {totalMatches > 0 && (
                <>
                  <div className="cl-stat">
                    <dt className="cl-stat__label">Odehraných zápasů</dt>
                    <dd className="cl-stat__val order-first">{totalMatches}</dd>
                  </div>
                  <div className="cl-stat">
                    <dt className="cl-stat__label">Vstřelených gólů</dt>
                    <dd className="cl-stat__val order-first">{totalGoals}</dd>
                  </div>
                </>
              )}
            </dl>

            <ol className="trn-grid" aria-label="Odehrané turnaje">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.slug} tournament={tournament} />
              ))}
            </ol>
          </>
        ) : isSupabaseConfigured() ? (
          <Notice tone="info">Výsledky odehraných turnajů sem brzy doplníme.</Notice>
        ) : (
          <Notice tone="accent">
            Archiv se načítá z databáze, která ještě není připojená. Doplň klíče Supabase do
            souboru .env.local (viz supabase/README.md).
          </Notice>
        )}

        {upcoming && (
          <div className="cl-card cl-card--gold">
            <div className="cl-card__in">
              <span className="cl-card__raster" aria-hidden />
              <div className="cl-card__body flex flex-col items-start gap-[var(--sp-4)] sm:flex-row sm:items-center">
                <div className="flex flex-1 flex-col gap-[var(--sp-1)]">
                  <span className="cl-sectionhead__over">Další na řadě</span>
                  <span className="trn-podium__team">{upcoming.name}</span>
                  <span className="roster-row__meta">
                    {[upcoming.format, upcoming.dateLabel].filter(Boolean).join(", ")}.{" "}
                    {upcoming.registrationOpen ? "Přihlášky jsou otevřené." : "Přihlášky zatím nejsou otevřené."}
                  </span>
                </div>
                <div className="flex flex-wrap gap-[var(--sp-3)]">
                  {CAMPAIGN.preview && (
                    <Link href={CAMPAIGN.preview.href} className="cl-btn cl-btn--ghost">
                      <span>{CAMPAIGN.preview.label}</span>
                    </Link>
                  )}
                  {upcoming.registrationOpen && (
                    <Link href="/prihlasit-tym" className="cl-btn cl-btn--secondary">
                      <span>Přihlásit tým</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
