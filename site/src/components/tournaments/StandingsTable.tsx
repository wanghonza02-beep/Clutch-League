import type { MatchOutcome, TableGroup } from "@/lib/tournaments";

const OUTCOME_LABEL: Record<MatchOutcome, string> = {
  W: "výhra",
  D: "remíza",
  L: "prohra",
};

function Form({ form }: { form: MatchOutcome[] }) {
  if (form.length === 0) return <span className="cl-table__num">—</span>;
  return (
    <span className="cl-form" role="img" aria-label={form.map((f) => OUTCOME_LABEL[f]).join(", ")}>
      {form.map((outcome, i) => (
        <span key={i} className={`cl-form__dot cl-form__dot--${outcome}`} aria-hidden>
          {outcome}
        </span>
      ))}
    </span>
  );
}

/**
 * Tabulka skupiny. Čísla se dopočítávají ze zadaných výsledků (buildTables),
 * takže se nemůžou rozejít se zápasy níže na stránce. Postup ze skupiny
 * označuje organizátor u týmu („Postoupil ze skupiny“) — zvýrazní se pruhem.
 */
export default function StandingsTable({ tables }: { tables: TableGroup[] }) {
  const anyAdvanced = tables.some((t) => t.rows.some((r) => r.team.advanced));
  return (
    <div className="flex flex-col gap-[var(--sp-8)]">
      {tables.map(({ group, rows }) => (
        <div key={group || "single"} className="cl-tablewrap">
          <table className="cl-table">
            <caption>{group ? `Skupina ${group}` : "Základní část"}</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Tým</th>
                <th scope="col">Forma</th>
                <th scope="col" className="cl-table__num">
                  <abbr title="Zápasy">Z</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title="Výhry">V</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title="Remízy">R</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title="Prohry">P</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title="Skóre">Skóre</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title="Rozdíl gólů">RG</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  Body
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.team.id}
                  className={row.team.advanced ? "cl-table__row--qualified" : undefined}
                >
                  <td className="cl-table__rank">{row.rank}</td>
                  <th scope="row" className="cl-table__team">
                    {row.team.name}
                    {row.team.advanced && <span className="sr-only"> (postoupil)</span>}
                  </th>
                  <td>
                    <Form form={row.form} />
                  </td>
                  <td className="cl-table__num">{row.played}</td>
                  <td className="cl-table__num">{row.wins}</td>
                  <td className="cl-table__num">{row.draws}</td>
                  <td className="cl-table__num">{row.losses}</td>
                  <td className="cl-table__num">
                    {row.goalsFor}:{row.goalsAgainst}
                  </td>
                  <td className="cl-table__num">
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </td>
                  <td className="cl-table__pts">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <p className="cl-footer-meta">
        {anyAdvanced && "Zlatý pruh označuje týmy, které postoupily ze skupiny. "}
        Pořadí se řadí podle bodů, pak rozdílu skóre a vstřelených gólů.
      </p>
    </div>
  );
}
