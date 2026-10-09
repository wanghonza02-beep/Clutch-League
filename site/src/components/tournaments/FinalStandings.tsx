import { finalStandings, type Tournament } from "@/lib/tournaments";

/** Konečné pořadí celého startovního pole, od vítěze po poslední tým. */
export default function FinalStandings({ tournament }: { tournament: Tournament }) {
  const rows = finalStandings(tournament);
  // Sloupec se skupinou dává smysl jen u turnaje hraného ve skupinách.
  const hasGroups = rows.some((r) => r.team.group);

  return (
    <div className="cl-tablewrap">
      <table className="cl-table" style={{ minWidth: "420px" }}>
        <caption>Konečné pořadí</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Tým</th>
            <th scope="col">Město</th>
            {hasGroups && <th scope="col">Skupina</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ rank, team }) => (
            <tr key={team.id} className={rank <= 3 ? "cl-table__row--qualified" : undefined}>
              <td className="cl-table__rank">{rank}</td>
              <th scope="row" className="cl-table__team">
                {team.name}
              </th>
              <td style={{ color: "var(--text-muted)" }}>{team.city}</td>
              {hasGroups && (
                <td style={{ color: "var(--text-faint)" }}>{team.group ?? "—"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
