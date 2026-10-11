import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import ForgotPasswordForm from "@/components/portal/ForgotPasswordForm";
import { getDictionary, pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: pageTitle(t, t.authPages.forgotMetaTitle),
    description: t.authPages.forgotMetaDescription,
  };
}

export default async function ZapomenuteHeslo() {
  const t = (await getDictionary()).authPages;

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="auth-shell flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.accountOver}</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text={t.forgotTitle}
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">{t.forgotSub}</p>
        </div>

        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <ForgotPasswordForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
