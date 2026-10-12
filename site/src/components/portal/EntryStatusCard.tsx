import { Ban, Check, Clock3, CalendarDays, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CONTACT } from "@/content/contact";
import { stageLabel } from "@/i18n/data";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import { formatDate, formatDateTime, formatTime, pragueIsoDay } from "@/lib/format";
import { PATHS } from "@/lib/portal/paths";
import type { CaptainEntry, TeamMatch } from "@/lib/portal/types";

type StepState = "done" | "current" | "waiting" | "failed";

const STEP_ICON: Record<StepState, LucideIcon> = {
  done: Check,
  current: Clock3,
  waiting: Clock3,
  failed: Ban,
};

function Step({
  state,
  title,
  icon,
  children,
}: {
  state: StepState;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  const Icon = icon ?? STEP_ICON[state];
  return (
    <li className={`status-step status-step--${state}`}>
      <span className="status-step__mark" aria-hidden>
        <Icon size={16} strokeWidth={2.5} />
      </span>
      <div className="status-step__body">
        <span className="status-step__title">{title}</span>
        <div className="status-step__text">{children}</div>
      </div>
    </li>
  );
}

/**
 * Stav přihlášky týmu na turnaj tak, jak ho vidí kapitán: odeslání →
 * rozhodnutí organizátora → soupiska → rozpis zápasů. Každý krok říká,
 * jestli je hotový a co dál.
 */
export default async function EntryStatusCard({
  entry,
  playerCount,
  schedule,
}: {
  entry: CaptainEntry;
  playerCount: number;
  schedule: TeamMatch[];
}) {
  const { locale, t: dict } = await getI18n();
  const t = dict.entryStatus;
  const { tournament } = entry;
  const decidedOn = entry.statusChangedAt ? formatDate(entry.statusChangedAt.slice(0, 10), locale) : "";

  const missing = Math.max(0, tournament.minRoster - playerCount);
  const extra = Math.max(0, playerCount - tournament.maxRoster);
  const rosterState: StepState = missing > 0 || extra > 0 ? "current" : "done";

  return (
    <section aria-labelledby="prihlaska-stav" className="cl-card status-card">
      <div className="cl-card__in">
        <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
          <header className="flex flex-col gap-[var(--sp-2)]">
            <span className="cl-sectionhead__over">{t.over}</span>
            <div className="flex flex-wrap items-center gap-[var(--sp-2)_var(--sp-4)]">
              <h2 id="prihlaska-stav" className="portal-h2">
                {tournament.name}
              </h2>
              <span
                className={
                  entry.status === "approved"
                    ? "cl-badge"
                    : entry.status === "rejected"
                      ? "cl-badge cl-badge--danger"
                      : "cl-badge cl-badge--neutral"
                }
              >
                {dict.labels.entryStatus[entry.status]}
              </span>
            </div>
            <p className="adm-meta">
              <span className="cl-num">{formatDate(tournament.startsOn, locale)}</span>
              {tournament.format && <span>{tournament.format}</span>}
            </p>
          </header>

          <ol className="status-steps">
            <Step state="done" title={t.sentTitle}>
              {fmt(t.sentText, { date: formatDateTime(entry.createdAt, locale) })}
            </Step>

            {entry.status === "pending" && (
              <Step state="current" title={t.decisionTitle}>
                {t.pendingText}
              </Step>
            )}
            {entry.status === "approved" && (
              <Step state="done" title={t.decisionTitle}>
                {decidedOn ? fmt(t.approvedOn, { date: decidedOn }) : t.approvedText}
              </Step>
            )}
            {entry.status === "rejected" && (
              <Step state="failed" title={t.decisionTitle}>
                <p>{decidedOn ? fmt(t.rejectedOn, { date: decidedOn }) : t.rejectedText}</p>
                {entry.statusNote && <p className="status-step__reason">{fmt(t.reason, { reason: entry.statusNote })}</p>}
                <p>{fmt(t.rejectedHelp, { email: CONTACT.email })}</p>
              </Step>
            )}

            {entry.status !== "rejected" && (
              <Step state={rosterState} title={t.rosterTitle} icon={rosterState === "done" ? Check : Users}>
                {fmt(t.rosterCount, {
                  count: plural(locale, playerCount, dict.counts.players),
                  min: tournament.minRoster,
                  max: tournament.maxRoster,
                })}{" "}
                {missing > 0
                  ? fmt(t.rosterMissing, { missing: plural(locale, missing, dict.counts.playersAcc) })
                  : extra > 0
                    ? fmt(t.rosterExtra, { extra: plural(locale, extra, dict.counts.playersAcc) })
                    : t.rosterOk}
              </Step>
            )}

            {entry.status === "approved" && (
              <Step state={schedule.length > 0 ? "done" : "waiting"} title={t.scheduleTitle} icon={CalendarDays}>
                {schedule.length === 0 ? (
                  t.scheduleNone
                ) : (
                  <ul className="status-matches" aria-label={t.scheduleTitle}>
                    {schedule.map((m) => (
                      <li key={m.id}>
                        <span className="cl-num status-matches__time">
                          {pragueIsoDay(m.kickoff) === tournament.startsOn
                            ? formatTime(m.kickoff)
                            : formatDateTime(m.kickoff, locale)}
                        </span>
                        <span className="status-matches__stage">{stageLabel(m.stage, dict)}</span>
                        <span>
                          {m.home} – {m.away}
                          {m.homeGoals !== null && m.awayGoals !== null && (
                            <span className="cl-num status-matches__score">
                              {" "}
                              {m.homeGoals}:{m.awayGoals}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Step>
            )}
          </ol>

          {entry.status !== "rejected" && tournament.registrationOpen && (
            <p className="adm-meta">
              <Link href={PATHS.teamRegistration}>{t.manage}</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
