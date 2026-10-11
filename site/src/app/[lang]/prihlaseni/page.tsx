import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import LoginForm from "@/components/portal/LoginForm";
import { localePath } from "@/i18n/config";
import { getDictionary, getI18n, pageTitle } from "@/i18n/server";
import { PATHS, safeNext } from "@/lib/portal/paths";
import { getSessionUser } from "@/lib/portal/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: pageTitle(t, t.authPages.loginMetaTitle),
    description: t.authPages.loginMetaDescription,
  };
}

/** Přihlášení: jen nadpis a formulář, stejně jako registrace a zapomenuté heslo. */
export default async function Prihlaseni({ searchParams }: PageProps<"/[lang]/prihlaseni">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.authPages;
  // `next` je cesta bez jazyka (/prihlasit-tym), jazyk se doplní při přesměrování.
  const next = safeNext((await searchParams).next, "");

  // Přihlášeného uživatele nemá smysl držet na přihlašovací stránce.
  if (await getSessionUser()) redirect(localePath(locale, next || PATHS.portal));

  const fromTeamRegistration = next === PATHS.teamRegistration;

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="auth-shell flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.portalOver}</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{
              fontSize: "var(--fs-h1)",
              fontStyle: "italic",
              lineHeight: "var(--lh-heading)",
            }}
            text={t.loginTitle}
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">{t.loginSub}</p>
        </div>

        {!isSupabaseConfigured() && <Notice tone="accent">{t.loginNotConfigured}</Notice>}

        {/* Účet ≠ přihláška týmu. Kdo jde od „Přihlásit tým“, dostane hlášku o dalším kroku. */}
        <Notice tone="accent">{fromTeamRegistration ? t.fromTeamRegistration : t.loginNotTeam}</Notice>

        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <LoginForm next={next || undefined} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
