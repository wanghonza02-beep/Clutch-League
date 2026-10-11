import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PortalHeader from "@/components/portal/PortalHeader";
import Notice from "@/components/ui/Notice";
import TeamForm from "@/components/portal/TeamForm";
import { localePath } from "@/i18n/config";
import { rich } from "@/i18n/rich";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { getCaptainTeam } from "@/lib/portal/data";
import { PATHS } from "@/lib/portal/paths";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.portal.teamMetaTitle) };
}

export default async function PortalTym() {
  const { locale, t: dict } = await getI18n();
  const t = dict.portal;
  const user = await requireRole("captain", locale);
  const team = await getCaptainTeam(user.id);
  // Tým vzniká jen přihláškou — bez ní není co upravovat.
  if (!team) redirect(localePath(locale, PATHS.teamRegistration));

  return (
    <>
      <PortalHeader over={t.teamOver} title={t.teamTitle} sub={t.teamSub} />

      <Notice tone="info">{rich(t.teamCodeNotice, { code: <span className="cl-num">{team.code}</span> })}</Notice>

      <div className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body">
            <TeamForm team={team} />
          </div>
        </div>
      </div>
    </>
  );
}
