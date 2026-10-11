import { getDictionary } from "@/i18n/server";
import { finalStandings, unrankedTeams, type Tournament } from "@/lib/tournaments";

/**
 * Konečné pořadí celého startovního pole, od vítěze po poslední tým. Týmy bez
 * zadaného umístění jsou na konci s pomlčkou místo čísla.
 */
export default async function FinalStandings({ tournament }: { tournament: Tournament }) {
  const t = (await getDictionary()).tournament;
  const rows = [
    ...finalStandings(tournament),
    ...unrankedTeams(tournament).map((team) => ({ rank: null, team })),
  ];
  // Sloupec se skupinou dává smysl jen u turnaje hraného ve skupinách,
  // město jen když ho u týmů známe.
  const hasGroups = rows.some((r) => r.team.group);
  const hasCity = rows.some((r) => r.team.city);

  return (
    <div className="cl-tablewrap">
      <table className="cl-table" style={{ minWidth: hasCity || hasGroups ? "420px" : undefined }}>
        <caption>{t.standingsTitle}</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{t.team}</th>
            {hasCity && <th scope="col">{t.city}</th>}
            {hasGroups && <th scope="col">{t.group}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ rank, team }) => (
            <tr key={team.id} className={rank !== null && rank <= 3 ? "cl-table__row--qualified" : undefined}>
              <td className="cl-table__rank">
                {rank ?? (
                  <span style={{ color: "var(--text-faint)" }} aria-label={t.unranked}>
                    –
                  </span>
                )}
              </td>
              <th scope="row" className="cl-table__team">
                {team.name}
              </th>
              {hasCity && <td style={{ color: "var(--text-muted)" }}>{team.city}</td>}
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
