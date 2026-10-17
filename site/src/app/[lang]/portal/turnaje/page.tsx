import type { Metadata } from "next";
import PortalHeader from "@/components/portal/PortalHeader";
import TournamentCards from "@/components/admin/TournamentCards";
import TournamentForm from "@/components/admin/TournamentForm";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { listTournamentSummaries } from "@/lib/admin/data";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.tournamentsMetaTitle) };
}

/**
 * Rozpis turnajů: všechny turnaje jako karty (probíhající a nadcházející
 * nahoře) a založení nového. Karta vede na stránku turnaje — údaje, stav,
 * zobrazení na webu, rozpis zápasů, střelci, ocenění a smazání. Úvodní stránka
 * webu ukazuje turnaje odsud (jen zobrazené na webu).
 */
export default async function PortalTurnaje() {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const tournaments = await listTournamentSummaries();

  return (
    <>
      <PortalHeader over={t.over} title={t.tournamentsTitle} sub={t.tournamentsSub} />

      <TournamentCards tournaments={tournaments} basePath="/portal/turnaje" empty={t.tournamentsEmpty} />

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
