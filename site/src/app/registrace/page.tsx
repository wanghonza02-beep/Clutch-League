import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import RegistrationSteps from "@/components/portal/RegistrationSteps";
import SignupForm from "@/components/portal/SignupForm";
import { PATHS, safeNext } from "@/lib/portal/paths";
import { getSessionUser } from "@/lib/portal/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Vytvořit účet | Clutch League",
  description:
    "Vytvoř si účet na Clutch League. Bez něj tým na turnaj přihlásit nejde.",
};

export default async function Registrace({ searchParams }: PageProps<"/registrace">) {
  const next = safeNext((await searchParams).next, "");

  // Kdo už účet má a je přihlášený, jde rovnou dál.
  if (await getSessionUser()) redirect(next || PATHS.teamRegistration);

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">Krok 1 ze 3</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{
              fontSize: "var(--fs-h1)",
              fontStyle: "italic",
              lineHeight: "var(--lh-heading)",
            }}
            text="Vytvořit účet"
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">
            Vytvoř si účet a pak hned přihlásíš svůj tým.
          </p>
        </div>

        <RegistrationSteps current={1} />

        {isSupabaseConfigured() ? (
          <Notice tone="accent">
            Kontakt slouží organizátorovi, aby věděl, kdo za tým odpovídá. Telefon nikde
            nezveřejňujeme.
          </Notice>
        ) : (
          <Notice tone="accent">
            Databáze ještě není připojená, účet teď vytvořit nepůjde. Doplň klíče Supabase do
            souboru .env.local (viz supabase/README.md).
          </Notice>
        )}

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
