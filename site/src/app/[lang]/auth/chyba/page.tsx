import type { Metadata } from "next";
import { KeyRound, LogIn } from "lucide-react";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import type { Dictionary } from "@/i18n/dictionaries";
import Link from "@/i18n/Link";
import { getDictionary, pageTitle } from "@/i18n/server";
import { PATHS } from "@/lib/portal/paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: pageTitle(t, t.authPages.linkErrorTitle) };
}

function reasonText(reason: string | undefined, t: Dictionary["authPages"]): string {
  switch (reason) {
    case "otp_expired":
      return t.linkExpired;
    case "bad_code_verifier":
    case "flow_state_not_found":
    case "exchange_failed":
      return t.linkOtherBrowser;
    case "not_configured":
      return t.linkNotConfigured;
    default:
      return t.linkInvalid;
  }
}

export default async function AuthChyba({ searchParams }: PageProps<"/[lang]/auth/chyba">) {
  const raw = (await searchParams).duvod;
  const reason = typeof raw === "string" ? raw : undefined;
  const t = (await getDictionary()).authPages;

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="auth-shell flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton fallback={PATHS.login} />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.accountOver}</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text={t.linkErrorTitle}
            textAlign="left"
          />
        </div>

        <Notice tone="error">{reasonText(reason, t)}</Notice>

        <p style={{ margin: 0, color: "var(--text-muted)" }}>{t.linkHelp}</p>

        <div className="flex flex-col gap-[var(--sp-3)] sm:flex-row">
          <Link href={PATHS.login} className="cl-btn cl-btn--primary">
            <LogIn size={18} strokeWidth={2} aria-hidden />
            <span>{t.loginButton}</span>
          </Link>
          <Link href={PATHS.forgotPassword} className="cl-btn cl-btn--secondary">
            <KeyRound size={18} strokeWidth={2} aria-hidden />
            <span>{t.forgotButton}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
