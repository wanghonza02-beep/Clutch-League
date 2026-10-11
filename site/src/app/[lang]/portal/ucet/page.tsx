import type { Metadata } from "next";
import NewPasswordForm from "@/components/portal/NewPasswordForm";
import PortalHeader from "@/components/portal/PortalHeader";
import ActionForm, { SubmitButton, TextInput } from "@/components/ui/ActionForm";
import Notice from "@/components/ui/Notice";
import { rich } from "@/i18n/rich";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { updateProfileAction } from "@/lib/portal/actions";
import { requireUser } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.portal.accountMetaTitle) };
}

/**
 * Nastavení účtu na jednom místě: jméno a telefon, pod tím nové heslo.
 * (Stránka /nove-heslo zůstává pro odkaz z e-mailu „zapomenuté heslo“.)
 */
export default async function PortalUcet() {
  const { locale, t: dict } = await getI18n();
  const t = dict.portal;
  const user = await requireUser(locale);

  return (
    <>
      <PortalHeader over={dict.labels.roles[user.role]} title={t.accountTitle} sub={t.accountSub} />

      <div className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body">
            <ActionForm action={updateProfileAction} idPrefix="acc" className="flex flex-col gap-[var(--sp-5)]">
              <div className="adm-grid adm-grid--wide">
                <TextInput name="name" label={dict.authForms.name} fallback={user.name} />
                <TextInput
                  name="phone"
                  label={dict.authForms.phone}
                  fallback={user.phone}
                  hint={dict.authForms.phoneHint}
                />
              </div>
              <div>
                <SubmitButton>{dict.common.saveChanges}</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      </div>

      <Notice tone="info">{rich(t.accountEmail, { email: <span className="cl-num">{user.email}</span> })}</Notice>

      <section aria-labelledby="zmena-hesla" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="zmena-hesla" className="portal-h2">
          {t.changePassword}
        </h2>
        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <NewPasswordForm inline />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
