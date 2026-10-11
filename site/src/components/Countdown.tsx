"use client";

import { useSyncExternalStore } from "react";

export type CountdownLabels = {
  label: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  today: string;
};

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

// Celé sekundy: snímek se mění jen jednou za sekundu.
const nowSeconds = () => Math.floor(Date.now() / 1000);
// Na serveru (a při hydrataci) čas neznáme — ukážou se pomlčky, ne špatné číslo.
const noTime = () => null;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Odpočet do začátku turnaje (dny, hodiny, minuty, sekundy). Od `startsAt`
 * do konce dne turnaje (`endsAt`) ukáže „Hrajeme dnes!“, potom zmizí.
 */
export default function Countdown({
  startsAt,
  endsAt,
  labels,
}: {
  startsAt: string;
  endsAt: string;
  labels: CountdownLabels;
}) {
  const now = useSyncExternalStore(subscribe, nowSeconds, noTime);
  const start = Math.floor(Date.parse(startsAt) / 1000);
  const end = Math.floor(Date.parse(endsAt) / 1000);

  if (now !== null && now >= start) {
    return now < end ? <p className="hero-countdown__today">{labels.today}</p> : null;
  }

  const left = now === null ? null : start - now;
  const units: [string, number | null][] = [
    [labels.days, left === null ? null : Math.floor(left / 86400)],
    [labels.hours, left === null ? null : Math.floor((left % 86400) / 3600)],
    [labels.minutes, left === null ? null : Math.floor((left % 3600) / 60)],
    [labels.seconds, left === null ? null : left % 60],
  ];

  return (
    <div className="hero-countdown" role="timer" aria-label={labels.label}>
      {units.map(([unit, value]) => (
        <div key={unit} className="hero-countdown__cell">
          <span className="hero-countdown__num">{value === null ? "--" : pad(value)}</span>
          <span className="hero-countdown__unit">{unit}</span>
        </div>
      ))}
    </div>
  );
}
