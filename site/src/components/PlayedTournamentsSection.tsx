import { ArrowRight } from "lucide-react";
import TournamentCard from "@/components/tournaments/TournamentCard";
import Notice from "@/components/ui/Notice";
import SplitText from "@/components/ui/SplitText";
import Link from "@/i18n/Link";
import { getDictionary } from "@/i18n/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTournaments, type Tournament } from "@/lib/tournaments";

/** Kolik posledních turnajů ukázat na úvodní stránce. Zbytek je na /turnaje. */
const LATEST_COUNT = 3;

/** Poslední odehrané turnaje z databáze. Bez databáze nebo při chybě prázdný seznam. */
async function loadLatest(): Promise<Tournament[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return (await getTournaments()).slice(0, LATEST_COUNT); // od nejnovějšího
  } catch (error) {
    console.error("[odehrané zápasy] turnaje se nenačetly", error);
    return [];
  }
}

/**
 * „Odehrané zápasy“ na úvodní stránce: posledních pár turnajů jako karty a
 * odkaz na celý archiv. Veřejné pro všechny — bez přihlášení i kontroly rolí.
 */
export default async function PlayedTournamentsSection() {
  const [latest, dict] = await Promise.all([loadLatest(), getDictionary()]);
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
        </div>

        {latest.length > 0 ? (
          <>
            <ol className="trn-grid" aria-label={t.listLabel}>
              {latest.map((tournament) => (
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
