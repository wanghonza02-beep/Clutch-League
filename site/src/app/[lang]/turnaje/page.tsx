import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import TournamentCard from "@/components/tournaments/TournamentCard";
import { CAMPAIGN } from "@/content/campaign";
import { formatLabel } from "@/i18n/data";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, pageTitle } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getActiveTournaments, getTournaments, tournamentSummaryStats } from "@/lib/tournaments";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: pageTitle(t, t.archive.metaTitle),
    description: t.archive.metaDescription,
  };
}

// Statická stránka, kterou Next po 5 minutách přegeneruje. Výsledek zapsaný
// organizátorem ji obnoví hned (revalidatePath v saveMatchResultAction).
export const revalidate = 300;

export default async function Turnaje() {
  const [{ locale, t: dict }, tournaments, active] = await Promise.all([
    getI18n(),
    getTournaments(),
    getActiveTournaments(),
  ]);
  // „Další na řadě“: nejbližší neodehraný turnaj (stejný jako v kampani na úvodu).
  const upcoming = active[0] ?? null;
  const t = dict.archive;
  const totals = tournaments.map(tournamentSummaryStats);
  const totalMatches = totals.reduce((sum, s) => sum + s.matches, 0);
  const totalGoals = totals.reduce((sum, s) => sum + s.goals, 0);

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton fallback="/#odehrane-zapasy" />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.over}</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{
              fontSize: "var(--fs-h1)",
              fontStyle: "italic",
              lineHeight: "var(--lh-heading)",
            }}
            text={t.title}
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">{t.sub}</p>
        </div>

        {tournaments.length > 0 ? (
          <>
            <dl className="hist-timeline__stats">
              <div className="cl-stat cl-stat--accent">
                <dt className="cl-stat__label">{t.tournaments}</dt>
                <dd className="cl-stat__val order-first">{tournaments.length}</dd>
              </div>
              {/* Bez zapsaných zápasů by tu byly jen nuly. */}
              {totalMatches > 0 && (
                <>
                  <div className="cl-stat">
                    <dt className="cl-stat__label">{t.matches}</dt>
                    <dd className="cl-stat__val order-first">{totalMatches}</dd>
                  </div>
                  <div className="cl-stat">
                    <dt className="cl-stat__label">{t.goals}</dt>
                    <dd className="cl-stat__val order-first">{totalGoals}</dd>
                  </div>
                </>
              )}
            </dl>

            <ol className="trn-grid" aria-label={t.listLabel}>
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.slug} tournament={tournament} />
              ))}
            </ol>
          </>
        ) : isSupabaseConfigured() ? (
          <Notice tone="info">{dict.played.empty}</Notice>
        ) : (
          <Notice tone="accent">{t.notConfigured}</Notice>
        )}

        {upcoming && (
          <div className="cl-card cl-card--gold">
            <div className="cl-card__in">
              <span className="cl-card__raster" aria-hidden />
              <div className="cl-card__body flex flex-col items-start gap-[var(--sp-4)] sm:flex-row sm:items-center">
                <div className="flex flex-1 flex-col gap-[var(--sp-1)]">
                  <span className="cl-sectionhead__over">{t.nextOver}</span>
                  <span className="trn-podium__team">{upcoming.name}</span>
                  <span className="roster-row__meta">
                    {[formatLabel(upcoming.format, locale), formatDate(upcoming.dateIso, locale)]
                      .filter(Boolean)
                      .join(", ")}
                    .{" "}
                    {upcoming.registrationOpen ? t.registrationOpen : t.registrationClosed}
                  </span>
                </div>
                <div className="flex flex-wrap gap-[var(--sp-3)]">
                  {CAMPAIGN.previewHref && (
                    <Link href={CAMPAIGN.previewHref} className="cl-btn cl-btn--ghost">
                      <span>{dict.rules.previewLabel}</span>
                    </Link>
                  )}
                  {upcoming.registrationOpen && (
                    <Link href="/prihlasit-tym" className="cl-btn cl-btn--secondary">
                      <span>{dict.common.registerTeam}</span>
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
