import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import ActionForm, { SubmitButton, TextInput } from "@/components/ui/ActionForm";
import Notice from "@/components/ui/Notice";
import { updateProfileAction } from "@/lib/portal/actions";
import { PATHS } from "@/lib/portal/paths";
import { requireUser } from "@/lib/portal/session";
import { ROLE_LABEL } from "@/lib/portal/types";

export const metadata: Metadata = {
  title: "Můj účet | Portál Clutch League",
};

const headingStyle = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-display)",
  fontStyle: "italic",
  fontSize: "var(--fs-h2)",
  lineHeight: "var(--lh-heading)",
  letterSpacing: "var(--ls-display)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
  margin: 0,
} as const;

export default async function PortalUcet() {
  const user = await requireUser();

  return (
    <>
      <header className="cl-sectionhead">
        <span className="cl-sectionhead__over">{ROLE_LABEL[user.role]}</span>
        <h1 style={headingStyle}>Můj účet</h1>
        <p className="cl-sectionhead__sub">
          Jméno a telefon vidí organizátor, aby se ti mohl ozvat. Nikde je nezveřejňujeme.
        </p>
      </header>

      <div className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
            <ActionForm action={updateProfileAction} idPrefix="acc" className="flex flex-col gap-[var(--sp-5)]">
              <div className="adm-grid adm-grid--wide">
                <TextInput name="name" label="Jméno a příjmení" fallback={user.name} />
                <TextInput name="phone" label="Telefon" fallback={user.phone} hint="Např. +420 777 123 456" />
              </div>
              <div>
                <SubmitButton>Uložit změny</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      </div>

      <Notice tone="info">
        Přihlašuješ se e-mailem <span className="cl-num">{user.email}</span>. E-mail jde změnit
        jen přes organizátora (napiš nám na kontakt).
      </Notice>

      <div>
        <Link href={PATHS.newPassword} className="cl-btn cl-btn--secondary">
          <KeyRound size={16} strokeWidth={2} aria-hidden />
          <span>Změnit heslo</span>
        </Link>
      </div>
    </>
  );
}
