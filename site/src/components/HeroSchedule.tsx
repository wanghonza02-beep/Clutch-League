"use client";

import { useId, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

export type ScheduleRow = {
  id: string;
  /** Čas výkopu, už naformátovaný ("09:00", jiný den i s datem). */
  time: string;
  home: string;
  away: string;
  /** "2 : 1", nebo null, dokud zápas nemá výsledek. */
  score: string | null;
};

export type ScheduleGroup = {
  /** Fáze v jazyce stránky ("Skupina A", "Finále"). */
  stage: string;
  matches: ScheduleRow[];
};

/**
 * Tlačítko „Rozpis zápasů“ pod kampaní. Rozpis zadává organizátor v administraci;
 * dokud žádný zápas není, tlačítko je vypnuté a pod ním je vysvětlení.
 */
export default function HeroSchedule({
  groups,
  labels,
}: {
  groups: ScheduleGroup[];
  labels: { button: string; empty: string };
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const empty = groups.length === 0;

  return (
    <div className="hero-schedule">
      <button
        type="button"
        className="cl-btn cl-btn--ghost hero-schedule__toggle"
        aria-expanded={empty ? undefined : open}
        aria-controls={empty ? undefined : panelId}
        disabled={empty}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarDays size={18} strokeWidth={2} aria-hidden />
        <span>{labels.button}</span>
        {!empty && <ChevronDown size={18} strokeWidth={2} aria-hidden className="hero-schedule__chev" />}
      </button>

      {empty ? (
        <p className="hero-schedule__note">{labels.empty}</p>
      ) : (
        <div id={panelId} className="hero-schedule__panel" hidden={!open}>
          {groups.map((group) => (
            <div key={group.stage} className="hero-schedule__group">
              <p className="hero-schedule__stage">{group.stage}</p>
              <ul aria-label={group.stage}>
                {group.matches.map((match) => (
                  <li key={match.id} className="hero-schedule__row">
                    <span className="hero-schedule__time">{match.time}</span>
                    <span className="hero-schedule__team hero-schedule__team--home">{match.home}</span>
                    <span className="hero-schedule__score">{match.score ?? "–"}</span>
                    <span className="hero-schedule__team">{match.away}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
