import { matchPoints } from "@/lib/admin/result";
import { findTeam, matchesByStage, type MatchEvent, type Tournament } from "@/lib/tournaments";

const EVENT_TEXT: Record<MatchEvent["kind"], string> = {
  goal: "gól",
  yellow_card: "žlutá karta",
  red_card: "červená karta",
};

/** Góly a karty jednoho týmu v zápase, seřazené podle minuty. */
function EventList({ events, label, align }: { events: MatchEvent[]; label: string; align: "home" | "away" }) {
  if (events.length === 0) return <div className={`match-events__side match-events__side--${align}`} />;
  return (
    <ul className={`match-events__side match-events__side--${align}`} aria-label={label}>
      {events.map((e, i) => (
        <li key={i} className="match-ev">
          <span className={`match-ev__mark match-ev__mark--${e.kind}`} aria-hidden />
          <span className="match-ev__min cl-num">{e.minute}′</span>
          <span>{e.player}</span>
          <span className="sr-only">, {EVENT_TEXT[e.kind]}</span>
        </li>
      ))}
    </ul>
  );
}

/** Kompletní výsledky turnaje, seskupené po fázích v pořadí odehrání. */
export default function ResultsTable({ tournament }: { tournament: Tournament }) {
  const stages = matchesByStage(tournament);

  return (
    <div className="flex flex-col gap-[var(--sp-8)]">
      {stages.map(({ stage, matches }) => (
        <div key={stage} className="cl-tablewrap">
          <table className="cl-table">
            <caption>{stage}</caption>
            <thead>
              <tr>
                <th scope="col">Výkop</th>
                <th scope="col" className="text-right">
                  Domácí
                </th>
                <th scope="col" className="text-center">
                  Skóre
                </th>
                <th scope="col">Hosté</th>
                <th scope="col" className="text-center">
                  Body
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
                          –<span className="sr-only">bez výsledku</span>
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
                            bodů ({home.name} {points[0]}, {away.name} {points[1]})
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
                          label={`Góly a karty: ${home.name}`}
                          align="home"
                        />
                      </td>
                      <td />
                      <td>
                        <EventList
                          events={match.events.filter((e) => e.teamId === match.awayId)}
                          label={`Góly a karty: ${away.name}`}
                          align="away"
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
        <p className="cl-footer-meta">Body za zápas: výhra 3, remíza 1, prohra 0.</p>
        {tournament.matches.some((m) => m.events.length > 0) && (
          <p className="cl-footer-meta" aria-hidden>
            <span className="match-legend">
              <span className="match-ev__mark match-ev__mark--goal" /> gól
            </span>
            <span className="match-legend">
              <span className="match-ev__mark match-ev__mark--yellow_card" /> žlutá karta
            </span>
            <span className="match-legend">
              <span className="match-ev__mark match-ev__mark--red_card" /> červená karta
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
