import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import LoginForm from "@/components/portal/LoginForm";
import { PATHS, safeNext } from "@/lib/portal/paths";
import { getSessionUser } from "@/lib/portal/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Přihlášení | Clutch League",
  description:
    "Přihlas se do Clutch League. Přihlásíš tým na turnaj a spravuješ soupisku hráčů.",
};

const roleTitle = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-semibold)",
  fontSize: "var(--fs-h6)",
  letterSpacing: "var(--ls-label)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
} as const;

export default async function Prihlaseni({ searchParams }: PageProps<"/prihlaseni">) {
  const next = safeNext((await searchParams).next, "");

  // Přihlášeného uživatele nemá smysl držet na přihlašovací stránce.
  if (await getSessionUser()) redirect(next || PATHS.portal);

  const fromTeamRegistration = next === PATHS.teamRegistration;

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>

        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">Portál</span>
          <SplitText
            tag="h1"
            className="cl-display"
            style={{
              fontSize: "var(--fs-h1)",
              fontStyle: "italic",
              lineHeight: "var(--lh-heading)",
            }}
            text="Přihlásit se"
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">
            Přihlas se e-mailem a heslem ze svého účtu.
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <Notice tone="accent">
            Databáze ještě není připojená, přihlášení nebude fungovat. Doplň klíče Supabase do
            souboru .env.local (viz supabase/README.md).
          </Notice>
        )}

        {fromTeamRegistration && (
          <Notice tone="accent">
            Pro přihlášení týmu se nejdřív přihlas, nebo si vytvoř účet. Pak tě pustíme
            rovnou k přihlášce.
          </Notice>
        )}

        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <LoginForm next={next || undefined} />
            </div>
          </div>
        </div>

        {/* Co která role v portálu dělá. */}
        <div className="grid gap-[var(--grid-gap)] sm:grid-cols-2">
          <div className="cl-card cl-card--flat">
            <div className="cl-card__in">
              <div className="cl-card__body flex flex-col gap-[var(--sp-2)]">
                <span style={{ color: "var(--gold)" }}>
                  <Users size={22} strokeWidth={2} aria-hidden />
                </span>
                <span style={roleTitle}>Kapitán týmu</span>
                <span className="roster-row__meta">
                  Účet si založí sám. Přihlásí tým na turnaj a spravuje soupisku hráčů.
                </span>
              </div>
            </div>
          </div>
          <div className="cl-card cl-card--flat">
            <div className="cl-card__in">
              <div className="cl-card__body flex flex-col gap-[var(--sp-2)]">
                <span style={{ color: "var(--gold)" }}>
                  <ShieldCheck size={22} strokeWidth={2} aria-hidden />
                </span>
                <span style={roleTitle}>Organizátor</span>
                <span className="roster-row__meta">
                  Schvaluje přihlášky a zapisuje výsledky. Přihlašuje se tímhle stejným formulářem.
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
