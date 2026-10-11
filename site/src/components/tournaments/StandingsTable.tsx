import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import type { MatchOutcome, TableGroup } from "@/lib/tournaments";

function Form({ form, outcome }: { form: MatchOutcome[]; outcome: Dictionary["tournament"]["outcome"] }) {
  if (form.length === 0) return <span className="cl-table__num">—</span>;
  return (
    <span className="cl-form" role="img" aria-label={form.map((f) => outcome[f]).join(", ")}>
      {form.map((result, i) => (
        <span key={i} className={`cl-form__dot cl-form__dot--${result}`} aria-hidden>
          {result}
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
export default async function StandingsTable({ tables }: { tables: TableGroup[] }) {
  const t = (await getDictionary()).tournament;
  const anyAdvanced = tables.some((table) => table.rows.some((r) => r.team.advanced));
  return (
    <div className="flex flex-col gap-[var(--sp-8)]">
      {tables.map(({ group, rows }) => (
        <div key={group || "single"} className="cl-tablewrap">
          <table className="cl-table">
            <caption>{group ? fmt(t.groupCaption, { group }) : t.singleTable}</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">{t.team}</th>
                <th scope="col">{t.formCol}</th>
                <th scope="col" className="cl-table__num">
                  <abbr title={t.played}>{t.playedAbbr}</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title={t.wins}>{t.winsAbbr}</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title={t.draws}>{t.drawsAbbr}</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title={t.losses}>{t.lossesAbbr}</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title={t.scoreCol}>{t.scoreCol}</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  <abbr title={t.goalDiff}>{t.goalDiffAbbr}</abbr>
                </th>
                <th scope="col" className="cl-table__num">
                  {t.pointsCol}
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
                    {row.team.advanced && <span className="sr-only"> {t.advanced}</span>}
                  </th>
                  <td>
                    <Form form={row.form} outcome={t.outcome} />
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
        {anyAdvanced && t.advancedNote}
        {t.sortNote}
      </p>
    </div>
  );
}
