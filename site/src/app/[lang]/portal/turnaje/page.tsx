import type { Metadata } from "next";
import PortalHeader from "@/components/portal/PortalHeader";
import TournamentForm from "@/components/admin/TournamentForm";
import Notice from "@/components/ui/Notice";
import { editionLabel } from "@/i18n/data";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { listTournaments } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.tournamentsMetaTitle) };
}

export default async function PortalTurnaje() {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const tournaments = await listTournaments();

  return (
    <>
      <PortalHeader over={t.over} title={t.tournamentsTitle} sub={t.tournamentsSub} />

      {tournaments.length === 0 ? (
        <Notice tone="info">{t.tournamentsEmpty}</Notice>
      ) : (
        <div className="cl-card">
          <div className="cl-card__in">
            <ul className="cl-card__body" aria-label={t.tournamentsTitle}>
              {tournaments.map((tournament) => (
                <li key={tournament.id} className="adm-item" style={{ gap: "var(--sp-3)" }}>
                  <div className="adm-item__head">
                    <Link href={`/portal/turnaje/${tournament.id}`} className="adm-item__title">
                      {tournament.name}
                    </Link>
                    <span className={tournament.status === "upcoming" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                      {tournament.status === "upcoming" ? t.upcoming : t.completed}
                    </span>
                    {tournament.registrationOpen && <span className="cl-badge">{t.registrationOpen}</span>}
                  </div>
                  <div className="adm-meta">
                    <span className="cl-num">{formatDate(tournament.startsOn, locale)}</span>
                    {tournament.edition && <span>{editionLabel(tournament.edition, dict)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <section aria-labelledby="novy-turnaj" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="novy-turnaj" className="portal-h2">
          {t.newTournament}
        </h2>
        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <TournamentForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
