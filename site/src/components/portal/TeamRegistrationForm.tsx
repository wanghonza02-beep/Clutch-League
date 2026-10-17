"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Notice from "@/components/ui/Notice";
import { EntryFormProvider } from "./EntryForm";
import TeamFields from "./TeamFields";
import { useT } from "@/i18n/client";
import LocaleField from "@/i18n/LocaleField";
import { registerTeamAction } from "@/lib/portal/actions";
import { IDLE, type FormState } from "@/lib/portal/validation";

/** Pole prvního kroku — když v nich akce najde chybu, formulář se na něj vrátí. */
const TEAM_FIELDS = ["name", "colors", "city", "foundedYear", "note"];

/**
 * Přihláška nového týmu ve dvou krocích jednoho formuláře: 1) údaje týmu
 * (kapitán je známý z účtu), 2) platba startovného a podmínky účasti
 * (`paymentStep`, vykreslí server). Odesílá se až z druhého kroku — obojí
 * najednou, akce zkontroluje obojí.
 */
export default function TeamRegistrationForm({ paymentStep }: { paymentStep: ReactNode }) {
  const t = useT().teamForms;
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [teamName, setTeamName] = useState("");
  const [nameMissing, setNameMissing] = useState(false);

  const show = (next: 1 | 2) => {
    setStep(next);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await registerTeamAction(prev, formData);
    // Chyba v údajích týmu → zpátky na první krok, ať je vidět, co opravit.
    if (result.errors && TEAM_FIELDS.some((field) => result.errors?.[field])) show(1);
    return result;
  }, IDLE);
  const errors = { ...(state.errors ?? {}), ...(nameMissing ? { name: t.nameFirst } : {}) };

  const toPayment = () => {
    const name = formRef.current?.elements.namedItem("name");
    const value = name instanceof HTMLInputElement ? name.value.trim() : "";
    setNameMissing(!value);
    if (!value) {
      (name as HTMLInputElement | null)?.focus();
      return;
    }
    setTeamName(value);
    show(2);
  };

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-[var(--sp-6)] scroll-mt-[calc(var(--nav-h)+var(--sp-6))]">
      <LocaleField />
      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      {/* Oba kroky jsou pořád ve formuláři — skrytá pole se odešlou taky. */}
      <div hidden={step !== 1} className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body flex flex-col gap-[var(--sp-6)]">
            <TeamFields errors={errors} values={state.values} />
            <div>
              <button
                type="button"
                className="cl-btn cl-btn--primary cl-btn--lg w-full sm:w-auto"
                onClick={toPayment}
              >
                <span>{t.toPayment}</span>
                <ArrowRight size={18} strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div hidden={step !== 2} className="flex flex-col gap-[var(--sp-6)]">
        <EntryFormProvider errors={state.errors} values={state.values} teamName={teamName}>
          {paymentStep}
        </EntryFormProvider>
        <div className="flex flex-col-reverse gap-[var(--sp-3)] sm:flex-row sm:items-center">
          <button type="button" className="cl-btn cl-btn--ghost" onClick={() => show(1)}>
            <ArrowLeft size={16} strokeWidth={2} aria-hidden />
            <span>{t.backToTeam}</span>
          </button>
          <button
            type="submit"
            className={`cl-btn cl-btn--primary cl-btn--lg w-full sm:w-auto${pending ? " cl-btn--loading" : ""}`}
            aria-disabled={pending || undefined}
            aria-busy={pending || undefined}
          >
            <span className="cl-btn-label">{t.submitEntry}</span>
            <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </form>
  );
}
