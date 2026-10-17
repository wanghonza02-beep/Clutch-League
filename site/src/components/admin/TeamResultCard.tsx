import { ChevronDown } from "lucide-react";
import ActionForm, { CellInput, SubmitButton } from "@/components/ui/ActionForm";
import Notice from "@/components/ui/Notice";
import { fmt, plural } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { savePlayerStatsAction } from "@/lib/admin/actions";
import type { ResultPlayer, ResultTeam } from "@/lib/admin/data";
import { RankingForm } from "./EntryRankingForm";

/**
 * Karta týmu v Zapsat výsledky. Zavřená ukazuje umístění, postup a stav
 * statistik; po rozkliknutí jde zapsat skupinu, pořadí, postup a statistiky
 * hráčů ze soupisky za celý turnaj (minuty, góly, žluté a červené karty).
 */
export default async function TeamResultCard({
  tournamentId,
  team,
  statsReady,
}: {
  tournamentId: string;
  team: ResultTeam;
  /** False = v databázi chybí tabulka statistik (migrace č. 9). */
  statsReady: boolean;
}) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  const rosterCount = team.players.filter((p) => p.playerId).length;
  // Názvy polí (p{i}_min…) čte savePlayerStatsAction.
  const columns: { field: string; label: string; short: string; value: (p: ResultPlayer) => number }[] = [
    { field: "min", label: t.statMinutes, short: t.statMinutesShort, value: (p) => p.minutes },
    { field: "goals", label: t.statGoals, short: t.statGoalsShort, value: (p) => p.goals },
    { field: "yellow", label: t.statYellow, short: t.statYellowShort, value: (p) => p.yellow },
    { field: "red", label: t.statRed, short: t.statRedShort, value: (p) => p.red },
  ];

  // Ke komu řádek patří: hráč ze soupisky, nebo uložená statistika smazaného hráče.
  const hidden: Record<string, string> = { tournamentId, teamId: team.teamId, count: String(team.players.length) };
  team.players.forEach((p, i) => {
    if (p.playerId) hidden[`p${i}_player`] = p.playerId;
    else if (p.statId) hidden[`p${i}_stat`] = p.statId;
  });
  const prefilled = !team.statsSaved && team.players.some((p) => p.goals || p.yellow || p.red);
  const ids = { ranking: `tym-${team.teamId}-poradi`, stats: `tym-${team.teamId}-hraci` };

  return (
    <li className="cl-card team-res" id={`tym-${team.teamId}`}>
      <div className="cl-card__in">
        <details className="team-res__details">
          {/* Flex až uvnitř: Safari neumí <summary> jako flex kontejner. */}
          <summary className="team-res__summary">
            <div className="tcard">
              <div className="tcard__main">
                <div className="tcard__head">
                  <h3 className="tcard__title">{team.teamName}</h3>
                  {team.finalRank !== null && (
                    <span className="cl-badge">{fmt(t.placeBadge, { rank: team.finalRank })}</span>
                  )}
                  {team.advanced && <span className="cl-badge cl-badge--neutral">{t.advancedBadge}</span>}
                </div>
                <p className="adm-meta" style={{ margin: 0 }}>
                  {team.groupLabel && <span>{fmt(t.groupBadge, { group: team.groupLabel })}</span>}
                  <span>{plural(locale, rosterCount, t.rosterCount)}</span>
                  {statsReady && <span>{team.statsSaved ? t.statsSavedState : t.statsMissingState}</span>}
                </p>
              </div>
              <ChevronDown size={22} strokeWidth={2} aria-hidden className="tcard__go team-res__chevron" />
            </div>
          </summary>

          <div className="team-res__body">
            <section aria-labelledby={ids.ranking} className="team-res__block">
              <h4 id={ids.ranking} className="adm-sub">
                {t.rankingTitle}
              </h4>
              <RankingForm tournamentId={tournamentId} entry={team} />
            </section>

            <section aria-labelledby={ids.stats} className="team-res__block">
              <h4 id={ids.stats} className="adm-sub">
                {t.statsTitle}
              </h4>
              {!statsReady ? (
                <Notice tone="accent">{t.statsMigration}</Notice>
              ) : team.players.length === 0 ? (
                <Notice tone="info">{t.statsNoRoster}</Notice>
              ) : (
                <ActionForm
                  action={savePlayerStatsAction}
                  idPrefix={`st-${team.teamId}`}
                  hidden={hidden}
                  className="flex flex-col gap-[var(--sp-4)]"
                >
                  <div className="cl-tablewrap">
                    <table className="cl-table stats-table">
                      <caption className="sr-only">{fmt(t.statsCaption, { team: team.teamName })}</caption>
                      <thead>
                        <tr>
                          <th scope="col" className="stats-table__num">
                            <abbr title={t.statNumber}>#</abbr>
                          </th>
                          <th scope="col">{t.player}</th>
                          {columns.map((c) => (
                            <th key={c.field} scope="col" className="text-center">
                              <abbr title={c.label}>{c.short}</abbr>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {team.players.map((p, i) => {
                          const name = `${p.firstName} ${p.lastName}`;
                          return (
                            <tr key={p.playerId ?? p.statId}>
                              <td className="stats-table__num cl-num">{p.number ?? "—"}</td>
                              <th scope="row" className="stats-table__player">
                                {name}
                                {!p.playerId && <span className="stats-table__note">{t.notOnRoster}</span>}
                              </th>
                              {columns.map((c) => (
                                <td key={c.field} data-label={c.short} className="stats-table__cell">
                                  <CellInput
                                    name={`p${i}_${c.field}`}
                                    label={fmt(t.statCell, { stat: c.label, player: name })}
                                    fallback={c.value(p) || ""}
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="adm-meta" style={{ margin: 0 }}>
                    {prefilled ? t.statsPrefilled : t.statsHint}
                  </p>
                  <div>
                    <SubmitButton size="sm" variant="secondary">
                      {t.saveStats}
                    </SubmitButton>
                  </div>
                </ActionForm>
              )}
            </section>
          </div>
        </details>
      </div>
    </li>
  );
}
