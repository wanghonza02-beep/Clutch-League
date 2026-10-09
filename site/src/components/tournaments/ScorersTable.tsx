import { findTeam, type Tournament } from "@/lib/tournaments";

/** Tabulka střelců turnaje. */
export default function ScorersTable({ tournament }: { tournament: Tournament }) {
  const scorers = [...tournament.scorers].sort((a, b) => b.goals - a.goals);

  return (
    <div className="cl-tablewrap">
      <table className="cl-table" style={{ minWidth: "420px" }}>
        <caption>Nejlepší střelci</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Hráč</th>
            <th scope="col">Tým</th>
            <th scope="col" className="cl-table__num">
              Góly
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
