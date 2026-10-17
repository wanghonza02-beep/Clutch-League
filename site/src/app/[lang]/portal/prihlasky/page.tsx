import type { Metadata } from "next";
import TournamentCards from "@/components/admin/TournamentCards";
import PortalHeader from "@/components/portal/PortalHeader";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { listTournamentSummaries } from "@/lib/admin/data";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.entriesMetaTitle) };
}

/** Přihlášky: turnaje jako karty, přihlášky na turnaj jsou na /portal/prihlasky/[turnaj]. */
export default async function PortalPrihlasky() {
  const { locale, t } = await getI18n();
  await requireRole("admin", locale);
  const tournaments = await listTournamentSummaries();

  return (
    <>
      <PortalHeader over={t.admin.over} title={t.admin.entriesTitle} />
      <TournamentCards tournaments={tournaments} basePath="/portal/prihlasky" />
    </>
  );
}
