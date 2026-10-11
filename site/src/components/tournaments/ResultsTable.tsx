import { stageLabel } from "@/i18n/data";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { matchPoints } from "@/lib/admin/result";
import { findTeam, matchesByStage, type MatchEvent, type Tournament } from "@/lib/tournaments";

/** Góly a karty jednoho týmu v zápase, seřazené podle minuty. */
function EventList({
  events,
  label,
  align,
  eventText,
}: {
  events: MatchEvent[];
  label: string;
  align: "home" | "away";
  eventText: Dictionary["tournament"]["eventText"];
}) {
  if (events.length === 0) return <div className={`match-events__side match-events__side--${align}`} />;
  return (
    <ul className={`match-events__side match-events__side--${align}`} aria-label={label}>
      {events.map((e, i) => (
        <li key={i} className="match-ev">
          <span className={`match-ev__mark match-ev__mark--${e.kind}`} aria-hidden />
          <span className="match-ev__min cl-num">{e.minute}′</span>
          <span>{e.player}</span>
          <span className="sr-only">, {eventText[e.kind]}</span>
        </li>
      ))}
    </ul>
  );
}

/** Kompletní výsledky turnaje, seskupené po fázích v pořadí odehrání. */
export default async function ResultsTable({ tournament }: { tournament: Tournament }) {
  const dict = await getDictionary();
  const t = dict.tournament;
  const stages = matchesByStage(tournament);

  return (
    <div className="flex flex-col gap-[var(--sp-8)]">
      {stages.map(({ stage, matches }) => (
        <div key={stage} className="cl-tablewrap">
          <table className="cl-table">
            <caption>{stageLabel(stage, dict)}</caption>
            <thead>
              <tr>
                <th scope="col">{t.kickoff}</th>
                <th scope="col" className="text-right">
                  {t.home}
                </th>
                <th scope="col" className="text-center">
                  {t.scoreCol}
                </th>
                <th scope="col">{t.away}</th>
                <th scope="col" className="text-center">
                  {t.pointsCol}
                </th>
                <th scope="col">Clutch Time</th>
              </tr>
            </thead>
            {matches.map((match) => {
              const home = findTeam(tournament, match.homeId);
              const away = findTeam(tournament, match.awayId);
              const played = match.homeGoals !== null && match.awayGoals !== null;
              const homeWin = played && (match.homeGoals ?? 0) > (match.awayGoals ?? 0);
              const awayWin = played && (match.awayGoals ?? 0) > (match.homeGoals ?? 0);
              const points = played ? matchPoints(match.homeGoals!, match.awayGoals!) : null;

              // Každý zápas má vlastní tbody: řádek s výsledkem + případně řádek
              // s góly a kartami, aby hover a oddělovač patřily k celému zápasu.
              return (
                <tbody key={match.id} className="match-block">
                  <tr>
                    <td className="cl-num" style={{ color: "var(--text-faint)" }}>
                      {match.time}
                    </td>
                    <td
                      className={`cl-table__team text-right ${homeWin ? "cl-side--win" : awayWin ? "cl-side--loss" : ""}`}
                    >
                      {home.name}
                    </td>
                    <td className="text-center">
                      {played ? (
                        <span className="cl-score">
                          <span>{match.homeGoals}</span>
                          <span className="cl-score__sep" aria-hidden>
                            :
                          </span>
                          <span>{match.awayGoals}</span>
                        </span>
                      ) : (
                        <span className="cl-score cl-score__sep">
                          –<span className="sr-only">{t.noResult}</span>
                        </span>
                      )}
                    </td>
                    <td
                      className={`cl-table__team ${awayWin ? "cl-side--win" : homeWin ? "cl-side--loss" : ""}`}
                    >
                      {away.name}
                    </td>
                    <td className="cl-num text-center" style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {points ? (
                        <>
                          {points[0]}:{points[1]}
                          <span className="sr-only">
                            {" "}
                            {fmt(t.pointsSr, {
                              home: home.name,
                              homePoints: points[0],
                              away: away.name,
                              awayPoints: points[1],
                            })}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ color: "var(--text-faint)", fontSize: "var(--fs-caption)" }}>
                      {match.clutchMode ?? "—"}
                    </td>
                  </tr>
                  {match.events.length > 0 && (
                    <tr className="match-events">
                      <td />
                      <td>
                        <EventList
                          events={match.events.filter((e) => e.teamId === match.homeId)}
                          label={fmt(t.eventsOf, { team: home.name })}
                          align="home"
                          eventText={t.eventText}
                        />
                      </td>
                      <td />
                      <td>
                        <EventList
                          events={match.events.filter((e) => e.teamId === match.awayId)}
                          label={fmt(t.eventsOf, { team: away.name })}
                          align="away"
                          eventText={t.eventText}
                        />
                      </td>
                      <td colSpan={2} />
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      ))}
      <div className="flex flex-col gap-[var(--sp-2)]">
        <p className="cl-footer-meta">{t.pointsRule}</p>
        {tournament.matches.some((m) => m.events.length > 0) && (
          <p className="cl-footer-meta" aria-hidden>
            <span className="match-legend">
              <span className="match-ev__mark match-ev__mark--goal" /> {t.eventText.goal}
            </span>
            <span className="match-legend">
              <span className="match-ev__mark match-ev__mark--yellow_card" /> {t.eventText.yellow_card}
            </span>
            <span className="match-legend">
              <span className="match-ev__mark match-ev__mark--red_card" /> {t.eventText.red_card}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
