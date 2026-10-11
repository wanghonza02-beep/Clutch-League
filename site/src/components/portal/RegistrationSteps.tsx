import { Check } from "lucide-react";
import { getDictionary } from "@/i18n/server";

/**
 * Postup přihlášení týmu. `current` je krok, na kterém uživatel stojí;
 * hodnota 4 znamená, že jsou hotové všechny tři.
 */
export default async function RegistrationSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  const t = (await getDictionary()).registration;
  return (
    <ol className="reg-steps" aria-label={t.stepsLabel}>
      {t.steps.map((step, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "upcoming";
        return (
          <li
            key={step.title}
            className={`reg-step reg-step--${state}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="reg-step__num cl-num" aria-hidden>
              {state === "done" ? <Check size={16} strokeWidth={3} /> : `0${n}`}
            </span>
            <span className="flex flex-col gap-[2px]">
              <span className="reg-step__title">
                {step.title}
                <span className="sr-only"> ({t.stepState[state]})</span>
              </span>
              <span className="reg-step__desc">{step.desc}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
