import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";
import PortalNav from "@/components/portal/PortalNav";
import { logoutAction } from "@/lib/portal/actions";
import { PATHS } from "@/lib/portal/paths";
import { requireUser } from "@/lib/portal/session";
import { ROLE_LABEL } from "@/lib/portal/types";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  // Stráž v layoutu chrání celou sekci. Jednotlivé akce si přesto ověřují
  // roli znovu — layout se při navigaci mezi podstránkami nespouští.
  const user = await requireUser();

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container">
        <div className="portal-shell">
          <aside className="portal-aside">
            <div className="portal-ident">
              <span className="cl-sectionhead__over">Portál</span>
              <span className="portal-ident__name">{user.name}</span>
              <span className="roster-row__meta">{ROLE_LABEL[user.role]}</span>
            </div>

            <PortalNav role={user.role} />

            <div className="flex flex-col items-start gap-[var(--sp-1)]">
              <Link href={PATHS.newPassword} className="cl-btn cl-btn--ghost cl-btn--sm">
                <KeyRound size={16} strokeWidth={2} aria-hidden />
                <span>Změnit heslo</span>
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="cl-btn cl-btn--ghost cl-btn--sm">
                  <LogOut size={16} strokeWidth={2} aria-hidden />
                  <span>Odhlásit se</span>
                </button>
              </form>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-[var(--sp-10)]">{children}</div>
        </div>
      </div>
    </main>
  );
}
