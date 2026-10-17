import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import { TaskList, daysUntil, relativeDays, tournamentTasks } from "@/components/admin/OverviewTasks";
import RegistrationToggle from "@/components/admin/RegistrationToggle";
import TournamentBadges from "@/components/admin/TournamentBadges";
import NotificationList from "@/components/portal/NotificationList";
import PortalHeader from "@/components/portal/PortalHeader";
import { fmt } from "@/i18n/format";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { getRegistrationOpenTournament, getTournamentOverview } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";
import { getNotifications } from "@/lib/portal/notifications";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.portal.overviewMetaTitle) };
}

/**
 * Přehled jednoho turnaje (karta v hlavním přehledu): přihlášky a výsledky
 * v číslech, přepínač přihlášek (otevřené / zavřené), co je potřeba udělat
 * a poslední dění — vše jen k tomuto turnaji.
 */
export default async function PrehledTurnaje({ params }: PageProps<"/[lang]/portal/prehled/[turnaj]">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.overview;
  const user = await requireRole("admin", locale);
  const { turnaj } = await params;
  const overview = await getTournamentOverview(turnaj);
  if (!overview) notFound();

  const { tournament, counts } = overview.group;
  const [activity, openTournament] = await Promise.all([
    getNotifications(user.id, { limit: 12, tournamentId: tournament.id }),
    getRegistrationOpenTournament(),
  ]);
  const tasks = tournamentTasks(overview, dict, locale);
  const active = tournament.status !== "completed";

  return (
    <>
      <div>
        <BackButton fallback="/portal" />
      </div>
      <PortalHeader over={dict.portalNav.overview} title={tournament.name} />

      <div className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
            <div className="flex flex-wrap items-center justify-between gap-[var(--sp-2)_var(--sp-4)]">
              <p className="adm-meta">
                <span className="cl-num">
                  {formatDate(tournament.startsOn, locale)}
                  {tournament.startTime && ` · ${tournament.startTime}`}
                </span>
                {active && <span>{relativeDays(daysUntil(tournament.startsOn), dict, locale)}</span>}
                {tournament.venue && <span>{tournament.venue}</span>}
                {tournament.format && <span>{tournament.format}</span>}
                <span>{fmt(dict.admin.rosterLimits, { min: tournament.minRoster, max: tournament.maxRoster })}</span>
              </p>
              {/* U nadcházejícího turnaje stav přihlášek ukazuje přepínač níž. */}
              <span className="flex flex-wrap gap-[var(--sp-2)]">
                <TournamentBadges tournament={tournament} phase={tournament.status !== "upcoming"} />
              </span>
            </div>

            {tournament.status === "upcoming" && (
              <RegistrationToggle
                tournament={tournament}
                otherOpen={openTournament && openTournament.id !== tournament.id ? openTournament.name : null}
              />
            )}

            <dl className="ov-stats">
              <div className="cl-stat">
                <dt className="cl-stat__label">{t.statApproved}</dt>
                <dd className="cl-stat__val order-first">{counts.approved}</dd>
              </div>
              <div className={`cl-stat${counts.pending > 0 ? " cl-stat--accent" : ""}`}>
                <dt className="cl-stat__label">{t.statPending}</dt>
                <dd className="cl-stat__val order-first">{counts.pending}</dd>
              </div>
              <div className="cl-stat">
                <dt className="cl-stat__label">{t.statMatches}</dt>
                <dd className="cl-stat__val order-first">
                  {overview.matches > 0 ? `${overview.played}/${overview.matches}` : "0"}
                </dd>
              </div>
            </dl>
            {overview.matches > 0 && <p className="adm-meta">{t.statMatchesHint}</p>}
          </div>
        </div>
      </div>

      <section aria-labelledby="ukoly" className="flex flex-col gap-[var(--sp-4)]">
        <h2 id="ukoly" className="portal-h2">
          {t.tasksTitle}
        </h2>
        <TaskList tasks={tasks} none={t.tasksNone} />
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
          <NotificationList items={activity} variant="feed" tournamentId={tournament.id} />
        )}
      </section>
    </>
  );
}
