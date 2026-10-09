import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import ForgotPasswordForm from "@/components/portal/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Zapomenuté heslo | Clutch League",
  description: "Pošleme ti odkaz na nastavení nového hesla ke tvému účtu.",
};

export default function ZapomenuteHeslo() {
  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">Účet</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text="Zapomenuté heslo"
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">
            Napiš e-mail, kterým se přihlašuješ. Pošleme ti odkaz, přes který si nastavíš nové
            heslo.
          </p>
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
