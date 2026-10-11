import { getDictionary } from "@/i18n/server";
import { findTeam, type Tournament } from "@/lib/tournaments";

/** Tabulka střelců turnaje. */
export default async function ScorersTable({ tournament }: { tournament: Tournament }) {
  const t = (await getDictionary()).tournament;
  const scorers = [...tournament.scorers].sort((a, b) => b.goals - a.goals);

  return (
    <div className="cl-tablewrap">
      <table className="cl-table" style={{ minWidth: "420px" }}>
        <caption>{t.scorersCaption}</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{t.player}</th>
            <th scope="col">{t.team}</th>
            <th scope="col" className="cl-table__num">
              {t.goalsCol}
            </th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((scorer, i) => (
            <tr key={`${scorer.player}-${scorer.teamId}`}>
              <td className="cl-table__rank">{i + 1}</td>
              <th scope="row" className="cl-table__team">
                {scorer.player}
              </th>
              <td style={{ color: "var(--text-muted)" }}>
                {findTeam(tournament, scorer.teamId).name}
              </td>
              <td className="cl-table__pts">{scorer.goals}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
