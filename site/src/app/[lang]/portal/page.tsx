import type { Metadata } from "next";
import { Send } from "lucide-react";
import { TaskList, globalTasks, tournamentTasks } from "@/components/admin/OverviewTasks";
import TournamentCards from "@/components/admin/TournamentCards";
import EntryStatusCard from "@/components/portal/EntryStatusCard";
import NotificationList from "@/components/portal/NotificationList";
import PortalHeader from "@/components/portal/PortalHeader";
import Notice from "@/components/ui/Notice";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { countCaptainsWithoutTeam, getTournamentOverview, listTournamentSummaries } from "@/lib/admin/data";
import { getCaptainEntries, getCaptainTeam, getOpenTournament, getTeamSchedule } from "@/lib/portal/data";
import { countUnreadByTournament, getNotifications } from "@/lib/portal/notifications";
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

/**
 * Hlavní přehled organizátora: všechny turnaje jako karty (u nadcházejících
 * počet úkolů, u všech nová oznámení) a úkoly mimo turnaje. Přehled jednoho
 * turnaje je na /portal/prehled/[turnaj].
 */
async function AdminOverviewPage({ user, passwordNotice }: { user: SessionUser; passwordNotice: React.ReactNode }) {
  const { locale, t: dict } = await getI18n();
  const t = dict.overview;
  const [tournaments, unread, captainsWithoutTeam] = await Promise.all([
    listTournamentSummaries(),
    countUnreadByTournament(user.id),
    countCaptainsWithoutTeam(),
  ]);
  // Turnaje, které ještě nejsou odehrané (připravuje se, přihlášky, probíhá).
  const active = tournaments.filter((tr) => tr.status !== "completed");
  // Úkoly neodehraných turnajů — na kartě jen jejich počet.
  const overviews = await Promise.all(active.map((tr) => getTournamentOverview(tr.id)));
  const taskCount = new Map(
    overviews.flatMap((o) => (o ? [[o.group.tournament.id, tournamentTasks(o, dict, locale).length] as const] : []))
  );
  const tasks = globalTasks({ hasUpcoming: active.length > 0, captainsWithoutTeam }, dict, locale);

  return (
    <>
      {passwordNotice}
      <PortalHeader over={dict.portal.adminOver} title={t.title} />

      <TournamentCards
        tournaments={tournaments}
        basePath="/portal/prehled"
        extra={(tr) => {
          const todo = taskCount.get(tr.id) ?? 0;
          const news = unread.get(tr.id) ?? 0;
          return (
            <>
              {todo > 0 && <span className="tcard__alert">{plural(locale, todo, t.tasksCount)}</span>}
              {news > 0 && <span className="tcard__alert">{plural(locale, news, t.unreadCount)}</span>}
            </>
          );
        }}
      />

      {tasks.length > 0 && (
        <section aria-labelledby="ukoly" className="flex flex-col gap-[var(--sp-4)]">
          <h2 id="ukoly" className="portal-h2">
            {t.tasksTitle}
          </h2>
          <TaskList tasks={tasks} none={t.tasksNone} />
        </section>
      )}
    </>
  );
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
 * Přehled: organizátor vidí turnaje jako karty (přehled turnaje s úkoly a děním
 * je na /portal/prehled/[turnaj]); kapitán stav své přihlášky krok za krokem
 * a nová oznámení.
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
