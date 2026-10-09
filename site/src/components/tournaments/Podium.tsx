import { Medal, Trophy } from "lucide-react";
import { finalStandings, type Tournament } from "@/lib/tournaments";

const PLACE_LABEL = ["Vítěz", "2. místo", "3. místo"];

/** Medailová místa. Vítěz dostane zlatý rám, zbytek standardní kartu. */
export default function Podium({ tournament }: { tournament: Tournament }) {
  const top = finalStandings(tournament).slice(0, 3);

  return (
    <ol className="trn-podium" aria-label="Medailová místa">
      {top.map(({ rank, team }) => (
        <li
          key={team.id}
          className={`cl-card trn-podium__item trn-podium__item--${rank}${rank === 1 ? " cl-card--gold" : ""}`}
        >
          <div className="cl-card__in">
            {rank === 1 && <span className="cl-card__raster" aria-hidden />}
            <div className="cl-card__body flex flex-col gap-[var(--sp-3)]">
              <div className="flex items-center justify-between gap-[var(--sp-3)]">
                <span className="cl-stat__label">{PLACE_LABEL[rank - 1]}</span>
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
