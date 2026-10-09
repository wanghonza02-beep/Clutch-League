import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { tournamentSummaryStats, winner, type Tournament } from "@/lib/tournaments";

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const champion = winner(tournament);
  const stats = tournamentSummaryStats(tournament);

  return (
    <li className="cl-card cl-card--interactive">
      <div className="cl-card__in">
        {/* Celá dlaždice je jeden odkaz; obsah uvnitř je dekorativní. */}
        <Link
          href={`/turnaje/${tournament.slug}`}
          className="trn-card"
          aria-label={`${tournament.name} ${tournament.dateLabel} — zobrazit výsledky`}
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
              {tournament.edition}
            </span>
          </span>

          <span className="trn-card__body">
            <h3 className="trn-card__title">{tournament.name}</h3>

            <span className="trn-card__meta cl-num">
              <span>{tournament.dateLabel}</span>
              <span>{tournament.venue}</span>
              <span>
                {stats.teams} týmů
                {stats.matches > 0 && ` · ${stats.matches} zápasů`}
              </span>
            </span>

            <p className="trn-card__desc">{tournament.summary}</p>

            <span className="trn-card__winner">
              {champion ? (
                <>
                  <Trophy size={16} strokeWidth={2} aria-hidden />
                  {champion.name}
                </>
              ) : (
                "Výsledky"
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
