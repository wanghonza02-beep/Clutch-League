import { getDictionary } from "@/i18n/server";
import { findTeam, type Tournament } from "@/lib/tournaments";

/** Statistiky hráčů za celý turnaj: minuty, góly, žluté a červené karty. */
export default async function PlayerStatsTable({ tournament }: { tournament: Tournament }) {
  const t = (await getDictionary()).tournament;
  return (
    <div className="cl-tablewrap">
      <table className="cl-table">
        <caption>{t.playerStatsCaption}</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{t.player}</th>
            <th scope="col">{t.team}</th>
            <th scope="col" className="cl-table__num">
              <abbr title={t.minutesTitle}>{t.minutesCol}</abbr>
            </th>
            <th scope="col" className="cl-table__num">
              {t.goalsCol}
            </th>
            <th scope="col" className="cl-table__num">
              <span className="match-legend" style={{ margin: 0 }}>
                <span className="match-ev__mark match-ev__mark--yellow_card" aria-hidden />
                {t.yellow}
              </span>
            </th>
            <th scope="col" className="cl-table__num">
              <span className="match-legend" style={{ margin: 0 }}>
                <span className="match-ev__mark match-ev__mark--red_card" aria-hidden />
                {t.red}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tournament.playerStats.map((row, i) => (
            <tr key={`${row.player}-${row.teamId}`}>
              <td className="cl-table__rank">{i + 1}</td>
              <th scope="row" className="cl-table__team">
                {row.player}
              </th>
              <td style={{ color: "var(--text-muted)" }}>{findTeam(tournament, row.teamId).name}</td>
              <td className="cl-table__num">{row.minutes ?? "—"}</td>
              <td className="cl-table__pts">{row.goals}</td>
              <td className="cl-table__num">{row.yellow || "—"}</td>
              <td className="cl-table__num">{row.red || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
