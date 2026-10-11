import { Goal, Hand, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { plural } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
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
export default async function Awards({ tournament }: { tournament: Tournament }) {
  const { locale, t: dict } = await getI18n();
  const t = dict.tournament;
  const scorer = topScorer(tournament);

  return (
    <ul className="trn-podium" aria-label={t.awardsLabel}>
      {scorer && (
        <AwardCard
          icon={Goal}
          label={t.topScorer}
          player={scorer.player}
          team={findTeam(tournament, scorer.teamId).name}
          value={String(scorer.goals)}
          valueLabel={plural(locale, scorer.goals, dict.counts.goalsUnit)}
        />
      )}
      {tournament.mvp && (
        <AwardCard
          icon={Star}
          label={t.mvp}
          player={tournament.mvp.player}
          team={findTeam(tournament, tournament.mvp.teamId).name}
        />
      )}
      {tournament.bestKeeper && (
        <AwardCard
          icon={Hand}
          label={t.bestKeeper}
          player={tournament.bestKeeper.player}
          team={findTeam(tournament, tournament.bestKeeper.teamId).name}
        />
      )}
    </ul>
  );
}
