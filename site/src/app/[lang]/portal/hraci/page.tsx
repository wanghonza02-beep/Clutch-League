import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PortalHeader from "@/components/portal/PortalHeader";
import RosterManager from "@/components/portal/RosterManager";
import Notice from "@/components/ui/Notice";
import { localePath } from "@/i18n/config";
import { fmt, plural } from "@/i18n/format";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { getCaptainEntries, getCaptainTeam, getOpenTournament } from "@/lib/portal/data";
import { PATHS } from "@/lib/portal/paths";
import { requireUser } from "@/lib/portal/session";
import { DEFAULT_MAX_ROSTER } from "@/lib/portal/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.portal.playersMetaTitle) };
}

export default async function PortalHraci() {
  const { locale, t: dict } = await getI18n();
  const t = dict.portal;
  const user = await requireUser(locale);
  const [team, openTournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);
  // Soupiska patří k týmu — bez přihlášky ho kapitán nejdřív přihlásí.
  // Organizátor bez vlastního týmu sem nepatří.
  if (!team) redirect(localePath(locale, user.role === "captain" ? PATHS.teamRegistration : PATHS.portal));

  // Limity soupisky: turnaj s otevřenými přihláškami, jinak nadcházející turnaj,
  // na který je tým přihlášený (i po uzávěrce přihlášek). Zamítnutá přihláška se nepočítá.
  const entries = await getCaptainEntries(team.id);
  const tournament =
    openTournament ?? entries.find((e) => e.status !== "rejected")?.tournament ?? null;

  const count = team.players.length;
  const minRoster = tournament?.minRoster ?? 1;
  const maxRoster = tournament?.maxRoster ?? DEFAULT_MAX_ROSTER;
  const missing = Math.max(0, minRoster - count);

  return (
    <>
      <PortalHeader
        over={t.rosterOver}
        title={t.playersTitle}
        sub={
          <>
            {t.playersSub}
            {tournament && (
              <>
                {" "}
                {fmt(t.rosterLimits, {
                  tournament: tournament.name,
                  min: plural(locale, minRoster, dict.counts.playersAcc),
                  max: plural(locale, maxRoster, dict.counts.playersAcc),
                })}
              </>
            )}
          </>
        }
      />

      {/* Limity jsou v podnadpisu, hláška říká jen, kolik hráčů chybí. */}
      {missing > 0 && count > 0 && (
        <Notice tone="accent">
          {fmt(tournament ? t.stillMissing : t.missingPlayers, {
            min: plural(locale, minRoster, dict.counts.playersAcc),
            missing: plural(locale, missing, dict.counts.playersAcc),
          })}
        </Notice>
      )}

      {count > maxRoster && (
        <Notice tone="accent">
          {fmt(t.tooManyPlayers, { max: plural(locale, maxRoster, dict.counts.playersAcc), count })}
        </Notice>
      )}

      <div className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body">
            <RosterManager players={team.players} minRoster={minRoster} maxRoster={maxRoster} />
          </div>
        </div>
      </div>
    </>
  );
}
