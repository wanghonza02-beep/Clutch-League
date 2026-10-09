import { Check } from "lucide-react";

const STEPS = [
  { title: "Účet", desc: "Jméno, kontakt a heslo." },
  { title: "Přihláška týmu", desc: "Název týmu a potvrzení." },
  { title: "Soupiska", desc: "Hráče doplníš kdykoli potom." },
];

const STATE_LABEL = {
  done: "hotovo",
  current: "právě tady",
  upcoming: "čeká",
} as const;

/**
 * Postup přihlášení týmu. `current` je krok, na kterém uživatel stojí;
 * hodnota 4 znamená, že jsou hotové všechny tři.
 */
export default function RegistrationSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="reg-steps" aria-label="Postup přihlášení týmu">
      {STEPS.map((step, i) => {
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
                <span className="sr-only"> ({STATE_LABEL[state]})</span>
              </span>
              <span className="reg-step__desc">{step.desc}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
