import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import Notice from "@/components/ui/Notice";
import { fmt } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import type { TournamentSummary } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";
import TournamentBadges from "./TournamentBadges";

/**
 * Turnaje jako karty — společné pro sekce portálu organizátora (Přehled,
 * Přihlášky, Rozpis turnajů, Zapsat výsledky). Karta vede na stránku turnaje
 * v dané sekci (`basePath/<id>`), nic se nerozbaluje samo, ani když je turnaj
 * jeden. Pořadí určuje listTournamentSummaries (probíhající a nadcházející
 * nahoře). `extra` přidá na kartu údaj, který potřebuje jen daná sekce.
 */
export default async function TournamentCards({
  tournaments,
  basePath,
  extra,
  empty,
}: {
  tournaments: TournamentSummary[];
  basePath: string;
  extra?: (tournament: TournamentSummary) => ReactNode;
  /** Prázdný stav, když žádný turnaj není (výchozí: turnaje se zakládají v Rozpisu turnajů). */
  empty?: string;
}) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;

  if (tournaments.length === 0) {
    return <Notice tone="info">{empty ?? t.noTournaments}</Notice>;
  }

  return (
    <ul className="tcards" aria-label={t.tournamentsLabel}>
      {tournaments.map((tournament) => (
        <li key={tournament.id} className="cl-card cl-card--interactive">
          <div className="cl-card__in">
            <Link href={`${basePath}/${tournament.id}`} className="tcard">
              <span className="tcard__main">
                <span className="tcard__head">
                  <h2 className="tcard__title">{tournament.name}</h2>
                  <TournamentBadges tournament={tournament} />
                </span>
                <span className="adm-meta">
                  <span className="cl-num">
                    {formatDate(tournament.startsOn, locale)}
                    {tournament.startTime && ` · ${tournament.startTime}`}
                  </span>
                  <span>
                    {fmt(t.groupCounts, {
                      approved: tournament.counts.approved,
                      pending: tournament.counts.pending,
                      rejected: tournament.counts.rejected,
                    })}
                  </span>
                  {extra?.(tournament)}
                </span>
              </span>
              <ChevronRight size={20} strokeWidth={2} aria-hidden className="tcard__go" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
