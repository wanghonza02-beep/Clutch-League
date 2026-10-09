import type { Metadata } from "next";
import Link from "next/link";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import NewPasswordForm from "@/components/portal/NewPasswordForm";
import { PATHS } from "@/lib/portal/paths";
import { getSessionUser } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: "Nové heslo | Clutch League",
};

/**
 * Sem vede odkaz z e-mailu „zapomenuté heslo“ (přes /auth/confirm, který
 * uživatele přihlásí). Přihlášený uživatel si tu může heslo změnit i jen tak.
 */
export default async function NoveHeslo() {
  const user = await getSessionUser();

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-10)]">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">Účet</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text="Nové heslo"
            textAlign="left"
          />
          {user && (
            <p className="cl-sectionhead__sub">
              Nastav nové heslo k účtu <span className="cl-num">{user.email}</span>.
            </p>
          )}
        </div>

        {user ? (
          <div className="cl-card">
            <div className="cl-card__in">
              <div className="cl-card__body">
                <NewPasswordForm />
              </div>
            </div>
          </div>
        ) : (
          <>
            <Notice tone="error">
              Odkaz na nové heslo vypršel, nebo se ho nepodařilo ověřit. Požádej si o nový.
            </Notice>
            <div>
              <Link href={PATHS.forgotPassword} className="cl-btn cl-btn--primary">
                <span>Poslat nový odkaz</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
