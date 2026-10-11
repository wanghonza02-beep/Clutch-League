import { Medal, Trophy } from "lucide-react";
import { getDictionary } from "@/i18n/server";
import { finalStandings, type Tournament } from "@/lib/tournaments";

/** Medailová místa. Vítěz dostane zlatý rám, zbytek standardní kartu. */
export default async function Podium({ tournament }: { tournament: Tournament }) {
  const t = (await getDictionary()).tournament;
  const top = finalStandings(tournament).slice(0, 3);

  return (
    <ol className="trn-podium" aria-label={t.podiumLabel}>
      {top.map(({ rank, team }) => (
        <li
          key={team.id}
          className={`cl-card trn-podium__item trn-podium__item--${rank}${rank === 1 ? " cl-card--gold" : ""}`}
        >
          <div className="cl-card__in">
            {rank === 1 && <span className="cl-card__raster" aria-hidden />}
            <div className="cl-card__body flex flex-col gap-[var(--sp-3)]">
              <div className="flex items-center justify-between gap-[var(--sp-3)]">
                <span className="cl-stat__label">{t.places[rank - 1]}</span>
                <span style={{ color: rank === 1 ? "var(--gold)" : "var(--text-faint)" }}>
                  {rank === 1 ? (
                    <Trophy size={20} strokeWidth={2} aria-hidden />
                  ) : (
                    <Medal size={20} strokeWidth={2} aria-hidden />
                  )}
                </span>
              </div>
              <span className="trn-podium__rank cl-num" aria-hidden>
                {rank}
              </span>
              <span className="trn-podium__team">{team.name}</span>
              {team.city && <span className="trn-podium__city">{team.city}</span>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
