import { LogOut } from "lucide-react";
import PortalNav, { type PortalBadges } from "@/components/portal/PortalNav";
import ActionToast from "@/components/ui/ActionToast";
import { countPendingEntries } from "@/lib/admin/data";
import { getCaptainTeam } from "@/lib/portal/data";
import { countUnreadNotifications } from "@/lib/portal/notifications";
import LocaleField from "@/i18n/LocaleField";
import { getI18n } from "@/i18n/server";
import { logoutAction } from "@/lib/portal/actions";
import { requireUser } from "@/lib/portal/session";

/**
 * Lišta portálu je jediná navigace mezi jeho sekcemi. Obsah stránek nese jen
 * data a akce té stránky — žádná tlačítka, která vedou tam, kam lišta.
 */
export default async function PortalLayout({ children }: LayoutProps<"/[lang]/portal">) {
  // Stráž v layoutu chrání celou sekci. Jednotlivé akce si přesto ověřují
  // roli znovu — layout se při navigaci mezi podstránkami nespouští.
  const { locale, t } = await getI18n();
  const user = await requireUser(locale);

  // Odznaky v liště: co na uživatele čeká (oznámení, přihlášky ke schválení).
  const [unread, pending, ownTeam] = await Promise.all([
    countUnreadNotifications(user.id),
    user.role === "admin" ? countPendingEntries() : Promise.resolve(0),
    user.role === "admin" ? getCaptainTeam(user.id) : Promise.resolve(null),
  ]);
  const badges: PortalBadges = { overview: unread, entries: pending };

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container">
        <div className="portal-shell">
          <aside className="portal-aside">
            <div className="portal-ident">
              <span className="cl-sectionhead__over">{t.portal.portalOver}</span>
              <span className="portal-ident__name">{user.name}</span>
              <span className="roster-row__meta">{t.labels.roles[user.role]}</span>
            </div>

            <PortalNav role={user.role} badges={badges} ownsTeam={Boolean(ownTeam)} />

            <form action={logoutAction} className="portal-logout">
              <LocaleField />
              <button type="submit" className="cl-btn cl-btn--ghost cl-btn--sm cl-btn--flush">
                <LogOut size={16} strokeWidth={2} aria-hidden />
                <span>{t.common.logout}</span>
              </button>
            </form>
          </aside>

          <div className="portal-main">{children}</div>
        </div>
        <ActionToast />
      </div>
    </main>
  );
}
