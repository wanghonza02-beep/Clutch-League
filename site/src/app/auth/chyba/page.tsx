import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, LogIn } from "lucide-react";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import { PATHS } from "@/lib/portal/paths";

export const metadata: Metadata = {
  title: "Odkaz nefunguje | Clutch League",
};

function reasonText(reason: string | undefined): string {
  switch (reason) {
    case "otp_expired":
      return "Odkaz už vypršel, nebo byl použitý. Odkazy z e-mailu platí jen chvíli a jen jednou.";
    case "bad_code_verifier":
    case "flow_state_not_found":
    case "exchange_failed":
      return "Odkaz je potřeba otevřít ve stejném prohlížeči, ze kterého přišla žádost o e-mail.";
    case "not_configured":
      return "Databáze ještě není připojená.";
    default:
      return "Odkaz je neplatný nebo neúplný.";
  }
}

export default async function AuthChyba({ searchParams }: PageProps<"/auth/chyba">) {
  const raw = (await searchParams).duvod;
  const reason = typeof raw === "string" ? raw : undefined;

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-8)]">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">Účet</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text="Odkaz nefunguje"
            textAlign="left"
          />
        </div>

        <Notice tone="error">{reasonText(reason)}</Notice>

        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          Potvrzení účtu si necháš poslat znovu na stránce přihlášení. Nové heslo si vyžádáš
          přes zapomenuté heslo.
        </p>

        <div className="flex flex-col gap-[var(--sp-3)] sm:flex-row">
          <Link href={PATHS.login} className="cl-btn cl-btn--primary">
            <LogIn size={18} strokeWidth={2} aria-hidden />
            <span>Přihlášení</span>
          </Link>
          <Link href={PATHS.forgotPassword} className="cl-btn cl-btn--secondary">
            <KeyRound size={18} strokeWidth={2} aria-hidden />
            <span>Zapomenuté heslo</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
