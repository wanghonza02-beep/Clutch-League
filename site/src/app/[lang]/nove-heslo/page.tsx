import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import NewPasswordForm from "@/components/portal/NewPasswordForm";
import Link from "@/i18n/Link";
import { rich } from "@/i18n/rich";
import { getDictionary, pageTitle } from "@/i18n/server";
import { PATHS } from "@/lib/portal/paths";
import { getSessionUser } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: pageTitle(t, t.authPages.newPasswordMetaTitle) };
}

/**
 * Sem vede odkaz z e-mailu „zapomenuté heslo“ (přes /auth/confirm, který
 * uživatele přihlásí). Přihlášený uživatel si tu může heslo změnit i jen tak.
 */
export default async function NoveHeslo() {
  const [user, dict] = await Promise.all([getSessionUser(), getDictionary()]);
  const t = dict.authPages;

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="auth-shell flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton fallback={user ? PATHS.portal : PATHS.login} />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.accountOver}</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text={t.newPasswordTitle}
            textAlign="left"
          />
          {user && (
            <p className="cl-sectionhead__sub">
              {rich(t.newPasswordSub, { email: <span className="cl-num">{user.email}</span> })}
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
            <Notice tone="error">{t.newPasswordExpired}</Notice>
            <div>
              <Link href={PATHS.forgotPassword} className="cl-btn cl-btn--primary">
                <span>{t.sendNewLink}</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
