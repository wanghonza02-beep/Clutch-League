import Image from "next/image";
import { ArrowRight, Trophy } from "lucide-react";
import { czechOnly, editionLabel } from "@/i18n/data";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { tournamentSummaryStats, winner, type Tournament } from "@/lib/tournaments";

export default async function TournamentCard({ tournament }: { tournament: Tournament }) {
  const { locale, t } = await getI18n();
  const champion = winner(tournament);
  const stats = tournamentSummaryStats(tournament);
  const date = formatDate(tournament.dateIso, locale);

  return (
    <li className="cl-card cl-card--interactive">
      <div className="cl-card__in">
        {/* Celá dlaždice je jeden odkaz; obsah uvnitř je dekorativní. */}
        <Link
          href={`/turnaje/${tournament.slug}`}
          className="trn-card"
          aria-label={fmt(t.tournament.cardAria, { name: tournament.name, date })}
        >
          <span className="trn-card__media">
            {tournament.photo ? (
              <Image
                src={tournament.photo.src}
                alt=""
                fill
                sizes="(max-width: 700px) 100vw, 400px"
                className="trn-card__img"
              />
            ) : (
              <span className="trn-card__raster" aria-hidden />
            )}
            <span className="trn-card__scrim" aria-hidden />
            <span className="cl-badge cl-badge--neutral trn-card__badge">
              {editionLabel(tournament.edition, t)}
            </span>
          </span>

          <span className="trn-card__body">
            <h3 className="trn-card__title">{tournament.name}</h3>

            <span className="trn-card__meta cl-num">
              <span>{date}</span>
              <span>{tournament.venue}</span>
              <span>
                {plural(locale, stats.teams, t.counts.teams)}
                {stats.matches > 0 && ` · ${plural(locale, stats.matches, t.counts.matches)}`}
              </span>
            </span>

            {czechOnly(tournament.summary, locale) && (
              <p className="trn-card__desc">{tournament.summary}</p>
            )}

            <span className="trn-card__winner">
              {champion ? (
                <>
                  <Trophy size={16} strokeWidth={2} aria-hidden />
                  {champion.name}
                </>
              ) : (
                t.tournament.cardResults
              )}
              <span className="trn-card__go" aria-hidden>
                <ArrowRight size={18} strokeWidth={2} />
              </span>
            </span>
          </span>
        </Link>
      </div>
    </li>
  );
}
