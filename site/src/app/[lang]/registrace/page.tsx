import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import RegistrationSteps from "@/components/portal/RegistrationSteps";
import SignupForm from "@/components/portal/SignupForm";
import { localePath } from "@/i18n/config";
import { getDictionary, getI18n, pageTitle } from "@/i18n/server";
import { PATHS, safeNext } from "@/lib/portal/paths";
import { getSessionUser } from "@/lib/portal/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: pageTitle(t, t.authPages.signupMetaTitle),
    description: t.authPages.signupMetaDescription,
  };
}

export default async function Registrace({ searchParams }: PageProps<"/[lang]/registrace">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.authPages;
  const next = safeNext((await searchParams).next, "");

  // Kdo už účet má a je přihlášený, jde rovnou dál.
  if (await getSessionUser()) redirect(localePath(locale, next || PATHS.teamRegistration));

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="auth-shell flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.signupOver}</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{
              fontSize: "var(--fs-h1)",
              fontStyle: "italic",
              lineHeight: "var(--lh-heading)",
            }}
            text={t.signupTitle}
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">{t.signupSub}</p>
        </div>

        <RegistrationSteps current={1} />

        <div className="flex flex-col gap-[var(--sp-3)]">
          {/* Účet ≠ přihláška týmu: tým je přihlášený, až kapitán odešle přihlášku. */}
          <Notice tone="accent">{t.signupNotTeam}</Notice>
          <Notice tone={isSupabaseConfigured() ? "info" : "accent"}>
            {isSupabaseConfigured() ? t.signupNotice : t.signupNotConfigured}
          </Notice>
        </div>

        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <SignupForm next={next || undefined} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
