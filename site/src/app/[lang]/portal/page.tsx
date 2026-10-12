import type { Metadata } from "next";
import {
  AlertTriangle,
  CalendarPlus,
  ClipboardPen,
  Flag,
  Inbox,
  Send,
  UserRoundX,
  Users,
  DoorClosed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import EntryStatusCard from "@/components/portal/EntryStatusCard";
import NotificationList from "@/components/portal/NotificationList";
import PortalHeader from "@/components/portal/PortalHeader";
import Notice from "@/components/ui/Notice";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { getAdminOverview, type AdminOverview } from "@/lib/admin/data";
import { formatDate, pragueIsoDay } from "@/lib/format";
import { getCaptainEntries, getCaptainTeam, getOpenTournament, getTeamSchedule } from "@/lib/portal/data";
import { getNotifications } from "@/lib/portal/notifications";
import { PATHS } from "@/lib/portal/paths";
import { requireUser } from "@/lib/portal/session";
import type { SessionUser } from "@/lib/portal/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.portal.overviewMetaTitle) };
}

/* -------------------------------------------------------------------------- */
/*  Organizátor                                                               */
/* -------------------------------------------------------------------------- */

type Task = { icon: LucideIcon; text: string; href: string; link: string; tone: "action" | "info" };

/** Za kolik dní turnaj je (záporné = už proběhl), podle pražského kalendáře. */
function daysUntil(isoDate: string): number {
  const today = Date.parse(`${pragueIsoDay(new Date().toISOString())}T00:00:00Z`);
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - today) / 86_400_000);
}

/** Co je potřeba udělat — seřazené od nejdůležitějšího, každé s odkazem přímo na místo. */
function adminTasks(o: AdminOverview, dict: Dictionary, locale: Locale): Task[] {
  const t = dict.overview;
  const tasks: Task[] = [];
  const focus = o.focus;

  if (!focus) {
    tasks.push({ icon: CalendarPlus, text: t.taskNoTournament, href: "/portal/turnaje#novy-turnaj", link: t.taskNoTournamentLink, tone: "action" });
  }
  if (o.pendingTotal > 0) {
    tasks.push({
      icon: Inbox,
      text: plural(locale, o.pendingTotal, t.taskPending),
      href: "/portal/prihlasky?stav=cekajici",
      link: t.taskPendingLink,
      tone: "action",
    });
  }
  if (focus) {
    const { tournament, counts } = focus.group;
    const days = daysUntil(tournament.startsOn);
    const detail = `/portal/turnaje/${tournament.id}`;

    if (focus.matchIssues > 0) {
      tasks.push({
        icon: AlertTriangle,
        text: plural(locale, focus.matchIssues, t.taskMatchIssues),
        href: `${detail}#zapasy`,
        link: t.taskMatchIssuesLink,
        tone: "action",
      });
    }
    if (focus.rosterIssues.length > 0) {
      tasks.push({
        icon: Users,
        text: fmt(t.taskRosters, {
          teams: focus.rosterIssues.map((r) => `${r.teamName} (${r.players})`).join(", "),
          min: tournament.minRoster,
          max: tournament.maxRoster,
        }),
        href: `/portal/prihlasky#tym-${focus.rosterIssues[0].teamId}`,
        link: t.taskRostersLink,
        tone: "action",
      });
    }
    if (days < 0) {
      tasks.push({
        icon: Flag,
        text: fmt(t.taskFinished, { name: tournament.name, date: formatDate(tournament.startsOn, locale) }),
        href: `${detail}#udaje`,
        link: t.taskFinishedLink,
        tone: "action",
      });
    }
    if (focus.resultsMissing > 0) {
      tasks.push({
        icon: ClipboardPen,
        text: plural(locale, focus.resultsMissing, t.taskResults),
        href: `/portal/vysledky?turnaj=${tournament.id}`,
        link: t.taskResultsLink,
        tone: "action",
      });
    }
    if (!tournament.registrationOpen && counts.approved >= 2 && focus.matches === 0 && days >= 0) {
      tasks.push({
        icon: CalendarPlus,
        text: t.taskSchedule,
        href: `${detail}#zapasy`,
        link: t.taskScheduleLink,
        tone: "action",
      });
    }
    const anyOpen = [focus.group, ...o.others].some((g) => g.tournament.registrationOpen);
    if (!anyOpen && days >= 0 && counts.approved + counts.pending === 0) {
      tasks.push({
        icon: DoorClosed,
        text: fmt(t.taskClosed, { name: tournament.name }),
        href: `${detail}#udaje`,
        link: t.taskClosedLink,
        tone: "info",
      });
    }
  }
  if (o.captainsWithoutTeam > 0) {
    tasks.push({
      icon: UserRoundX,
      text: plural(locale, o.captainsWithoutTeam, t.taskNoTeam),
      href: "/portal/uzivatele?filtr=bez-tymu",
      link: t.taskNoTeamLink,
      tone: "info",
    });
  }
  return tasks;
}

async function AdminOverviewPage({ user, passwordNotice }: { user: SessionUser; passwordNotice: React.ReactNode }) {
  const { locale, t: dict } = await getI18n();
  const t = dict.overview;
  const [overview, activity] = await Promise.all([getAdminOverview(), getNotifications(user.id, { limit: 12 })]);
  const tasks = adminTasks(overview, dict, locale);
  const focus = overview.focus;

  return (
    <>
      {passwordNotice}
      <PortalHeader over={dict.portal.adminOver} title={t.title} sub={t.adminSub} />

      {focus ? (
        <section aria-labelledby="hlavni-turnaj" className="cl-card ov-focus">
          <div className="cl-card__in">
            <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
              <header className="flex flex-col gap-[var(--sp-2)]">
                <span className="cl-sectionhead__over">{t.focusOver}</span>
                <div className="flex flex-wrap items-center gap-[var(--sp-2)_var(--sp-4)]">
                  <h2 id="hlavni-turnaj" className="portal-h2">
                    <Link href={`/portal/turnaje/${focus.group.tournament.id}`} className="ov-focus__link">
                      {focus.group.tournament.name}
                    </Link>
                  </h2>
                  <span className={focus.group.tournament.registrationOpen ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                    {focus.group.tournament.registrationOpen ? dict.admin.registrationOpen : dict.admin.registrationClosedBadge}
                  </span>
                </div>
                <p className="adm-meta">
                  <span className="cl-num">{formatDate(focus.group.tournament.startsOn, locale)}</span>
                  <span>{relativeDays(daysUntil(focus.group.tournament.startsOn), dict, locale)}</span>
                  {focus.group.tournament.format && <span>{focus.group.tournament.format}</span>}
                  <span>
                    {fmt(dict.admin.rosterLimits, {
                      min: focus.group.tournament.minRoster,
                      max: focus.group.tournament.maxRoster,
                    })}
                  </span>
                </p>
              </header>

              <dl className="ov-stats">
                <div className="cl-stat">
                  <dt className="cl-stat__label">{t.statApproved}</dt>
                  <dd className="cl-stat__val order-first">{focus.group.counts.approved}</dd>
                </div>
                <div className={`cl-stat${focus.group.counts.pending > 0 ? " cl-stat--accent" : ""}`}>
                  <dt className="cl-stat__label">{t.statPending}</dt>
                  <dd className="cl-stat__val order-first">{focus.group.counts.pending}</dd>
                </div>
                <div className="cl-stat">
                  <dt className="cl-stat__label">{t.statPlayers}</dt>
                  <dd className="cl-stat__val order-first">{focus.players}</dd>
                </div>
                <div className="cl-stat">
                  <dt className="cl-stat__label">{t.statMatches}</dt>
                  <dd className="cl-stat__val order-first">
                    {focus.matches > 0 ? `${focus.played}/${focus.matches}` : "0"}
                  </dd>
                </div>
              </dl>
              {focus.matches > 0 && <p className="adm-meta">{t.statMatchesHint}</p>}
            </div>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="ukoly" className="flex flex-col gap-[var(--sp-4)]">
        <h2 id="ukoly" className="portal-h2">
          {t.tasksTitle}
        </h2>
        {tasks.length === 0 ? (
          <Notice tone="ok">{t.tasksNone}</Notice>
        ) : (
          <ul className="tasks">
            {tasks.map((task) => (
              <li key={task.text} className={`tasks__item tasks__item--${task.tone}`}>
                <span className="tasks__icon" aria-hidden>
                  <task.icon size={18} strokeWidth={2} />
                </span>
                <span className="tasks__text">{task.text}</span>
                <Link href={task.href} className="tasks__link">
                  {task.link}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="deni" className="flex flex-col gap-[var(--sp-4)]">
        <h2 id="deni" className="portal-h2">
          {t.activityTitle}
        </h2>
        {activity.length === 0 ? (
          <p className="adm-meta" style={{ margin: 0 }}>
            {t.activityNone}
          </p>
        ) : (
          <NotificationList items={activity} variant="feed" />
        )}
      </section>

      {overview.others.length > 0 && (
        <section aria-labelledby="dalsi-turnaje" className="flex flex-col gap-[var(--sp-4)]">
          <h2 id="dalsi-turnaje" className="adm-sub">
            {t.othersTitle}
          </h2>
          <ul className="flex flex-col gap-[var(--sp-3)]">
            {overview.others.map(({ tournament, counts }) => (
              <li key={tournament.id} className="flex flex-wrap items-center gap-[var(--sp-2)_var(--sp-4)]">
                <Link href={`/portal/turnaje/${tournament.id}`} className="adm-item__title">
                  {tournament.name}
                </Link>
                <span className="roster-row__meta cl-num">{formatDate(tournament.startsOn, locale)}</span>
                <span className="roster-row__meta">
                  {fmt(dict.admin.groupCounts, {
                    approved: counts.approved,
                    pending: counts.pending,
                    rejected: counts.rejected,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function relativeDays(days: number, dict: Dictionary, locale: Locale): string {
  const t = dict.overview;
  if (days === 0) return t.today;
  if (days > 0) return plural(locale, days, t.inDays);
  return plural(locale, -days, t.daysAgo);
}

/* -------------------------------------------------------------------------- */
/*  Kapitán                                                                   */
/* -------------------------------------------------------------------------- */

async function CaptainOverviewPage({ user, passwordNotice }: { user: SessionUser; passwordNotice: React.ReactNode }) {
  const { locale, t: dict } = await getI18n();
  const t = dict.portal;
  const [team, openTournament, unread] = await Promise.all([
    getCaptainTeam(user.id),
    getOpenTournament(),
    getNotifications(user.id, { unreadOnly: true }),
  ]);

  // Kapitán bez týmu: tým vzniká jen přes přihlášku, ne v portálu. Přihláška
  // v liště není, tak je tu jako jediný další krok.
  if (!team) {
    return (
      <>
        {passwordNotice}
        <NotificationList items={unread} variant="banners" />
        <PortalHeader
          over={t.overviewOver}
          title={fmt(t.welcome, { name: user.name })}
          sub={openTournament ? fmt(t.noTeamOpen, { tournament: openTournament.name }) : t.noTeamClosed}
        />
        {openTournament && (
          <div>
            <Link href={PATHS.teamRegistration} className="cl-btn cl-btn--primary cl-btn--lg">
              <Send size={18} strokeWidth={2} aria-hidden />
              <span>{dict.common.registerTeam}</span>
            </Link>
          </div>
        )}
      </>
    );
  }

  const entries = await getCaptainEntries(team.id);
  const schedules = await Promise.all(
    entries.map((e) => (e.status === "approved" ? getTeamSchedule(team.id, e.tournamentId) : Promise.resolve([])))
  );
  const enteredOpen = openTournament && entries.some((e) => e.tournamentId === openTournament.id);
  const captain = team.players.find((p) => p.captain);

  return (
    <>
      {passwordNotice}
      <NotificationList items={unread} variant="banners" />
      <PortalHeader
        over={t.overviewOver}
        title={team.name}
        sub={[
          team.city,
          team.foundedYear ? fmt(t.founded, { year: team.foundedYear }).replace(/^ · /, "") : "",
          team.colors,
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <dl className="hist-timeline__stats">
        <div className="cl-stat">
          <dt className="cl-stat__label">{t.teamCode}</dt>
          <dd className="cl-stat__val order-first cl-num" style={{ fontSize: "var(--fs-h5)" }}>
            {team.code}
          </dd>
        </div>
        <div className="cl-stat">
          <dt className="cl-stat__label">{t.onRoster}</dt>
          <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
            {plural(locale, team.players.length, dict.counts.players)}
          </dd>
        </div>
        <div className="cl-stat">
          <dt className="cl-stat__label">{t.fieldCaptain}</dt>
          <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
            {captain ? `${captain.firstName} ${captain.lastName}` : t.noCaptain}
          </dd>
        </div>
      </dl>

      {entries.map((entry, i) => (
        <EntryStatusCard key={entry.tournamentId} entry={entry} playerCount={team.players.length} schedule={schedules[i]} />
      ))}

      {openTournament && !enteredOpen && (
        <Notice tone="accent">
          {fmt(t.notEntered, { tournament: openTournament.name })}{" "}
          <Link href={PATHS.teamRegistration} style={{ color: "var(--text-link)" }}>
            {dict.common.registerTeam}
          </Link>
        </Notice>
      )}
      {!openTournament && entries.length === 0 && <Notice tone="info">{t.noTournamentNow}</Notice>}
    </>
  );
}

/**
 * Přehled: organizátor vidí hlavní turnaj, co je potřeba udělat a poslední
 * dění; kapitán stav své přihlášky krok za krokem a nová oznámení.
 * Na sekce portálu vede lišta — tady jsou jen odkazy na konkrétní místo.
 */
export default async function PortalPrehled({ searchParams }: PageProps<"/[lang]/portal">) {
  const { locale, t: dict } = await getI18n();
  const user = await requireUser(locale);
  const passwordChanged = (await searchParams).heslo === "zmeneno";

  const passwordNotice = passwordChanged && (
    <Notice tone="ok" live>
      {dict.portal.passwordChanged}
    </Notice>
  );

  return user.role === "admin" ? (
    <AdminOverviewPage user={user} passwordNotice={passwordNotice} />
  ) : (
    <CaptainOverviewPage user={user} passwordNotice={passwordNotice} />
  );
}
