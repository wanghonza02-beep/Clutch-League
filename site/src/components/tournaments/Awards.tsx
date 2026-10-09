import { Goal, Hand, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { findTeam, topScorer, type Tournament } from "@/lib/tournaments";

function AwardCard({
  icon: Icon,
  label,
  player,
  team,
  value,
  valueLabel,
}: {
  icon: LucideIcon;
  label: string;
  player: string;
  team: string;
  value?: string;
  valueLabel?: string;
}) {
  return (
    <li className="cl-card">
      <div className="cl-card__in">
        <div className="cl-card__body trn-award">
          <span className="trn-award__icon" aria-hidden>
            <Icon size={28} strokeWidth={2} />
          </span>
          <div className="flex flex-1 flex-col gap-[var(--sp-1)]">
            <span className="cl-stat__label">{label}</span>
            <span className="roster-row__name" style={{ fontSize: "var(--fs-h5)" }}>
              {player}
            </span>
            <span className="roster-row__meta">{team}</span>
            {value && (
              <span className="flex items-baseline gap-[var(--sp-2)] pt-[var(--sp-2)]">
                <span className="trn-award__value">{value}</span>
                <span className="cl-stat__label">{valueLabel}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Individuální ocenění turnaje: nejlepší střelec, MVP, brankář. */
export default function Awards({ tournament }: { tournament: Tournament }) {
  const scorer = topScorer(tournament);

  return (
    <ul className="trn-podium" aria-label="Individuální ocenění">
      {scorer && (
        <AwardCard
          icon={Goal}
          label="Nejlepší střelec"
          player={scorer.player}
          team={findTeam(tournament, scorer.teamId).name}
          value={String(scorer.goals)}
          valueLabel="gólů"
        />
      )}
      {tournament.mvp && (
        <AwardCard
          icon={Star}
          label="Hráč turnaje"
          player={tournament.mvp.player}
          team={findTeam(tournament, tournament.mvp.teamId).name}
        />
      )}
      {tournament.bestKeeper && (
        <AwardCard
          icon={Hand}
          label="Nejlepší brankář"
          player={tournament.bestKeeper.player}
          team={findTeam(tournament, tournament.bestKeeper.teamId).name}
        />
      )}
    </ul>
  );
}
