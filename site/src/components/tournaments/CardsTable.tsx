import { getDictionary } from "@/i18n/server";
import { findTeam, type Tournament } from "@/lib/tournaments";

/** Žluté a červené karty turnaje po hráčích (z karet zapsaných u zápasů). */
export default async function CardsTable({ tournament }: { tournament: Tournament }) {
  const t = (await getDictionary()).tournament;
  return (
    <div className="cl-tablewrap">
      <table className="cl-table" style={{ minWidth: "420px" }}>
        <caption>{t.cardsCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{t.player}</th>
            <th scope="col">{t.team}</th>
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
          {tournament.cards.map((row) => (
            <tr key={`${row.player}-${row.teamId}`}>
              <th scope="row" className="cl-table__team">
                {row.player}
              </th>
              <td style={{ color: "var(--text-muted)" }}>{findTeam(tournament, row.teamId).name}</td>
              <td className="cl-table__num">{row.yellow || "—"}</td>
              <td className="cl-table__num">{row.red || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
