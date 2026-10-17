import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TournamentCards from "@/components/admin/TournamentCards";
import PortalHeader from "@/components/portal/PortalHeader";
import { fmt } from "@/i18n/format";
import { getDictionary, getI18n, localeHref, portalTitle } from "@/i18n/server";
import { isUuid, listTournamentSummaries } from "@/lib/admin/data";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.resultsMetaTitle) };
}

/** Zapsat výsledky: turnaje jako karty, zápasy turnaje jsou na /portal/vysledky/[turnaj]. */
export default async function PortalVysledky({ searchParams }: PageProps<"/[lang]/portal/vysledky">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);

  // Starší odkaz /portal/vysledky?turnaj=<id> vede na stránku turnaje.
  const { turnaj } = await searchParams;
  if (typeof turnaj === "string" && isUuid(turnaj)) redirect(await localeHref(`/portal/vysledky/${turnaj}`));

  const tournaments = await listTournamentSummaries();

  return (
    <>
      <PortalHeader over={t.over} title={t.resultsTitle} sub={t.resultsSub} />
      <TournamentCards
        tournaments={tournaments}
        basePath="/portal/vysledky"
        extra={(tr) => tr.matches > 0 && <span>{fmt(t.written, { done: tr.played, total: tr.matches })}</span>}
      />
    </>
  );
}
