const STEPS = [
  {
    n: "01",
    title: "Sežeň partu",
    desc: "Slož tým na 3 na 3, klidně i s náhradníky.",
  },
  {
    n: "02",
    title: "Napiš nám na Instagramu",
    desc: "Pošli DM na @clutchleague_football se jménem týmu a kontaktem na kapitána.",
  },
  {
    n: "03",
    title: "Potvrď účast",
    desc: "Jakmile místo potvrdíme, tým je přihlášený do turnaje.",
  },
];

export default function HowToJoin() {
  return (
    <section id="jak-se-zapojit" className="cl-section border-b border-[var(--border-subtle)]">
      <div className="cl-container">
        <div className="cl-sectionhead" style={{ marginBottom: "var(--sp-12)" }}>
          <h2 className="cl-sectionhead__title">Jak se zapojit</h2>
          <p className="cl-sectionhead__sub">
            Tři kroky mezi tebou a hřištěm. Bez formulářů, bez čekání na e-mail.
          </p>
        </div>

        <ol className="mx-auto flex max-w-[560px] flex-col">
          {STEPS.map((step, i) => (
            <li key={step.n} className="relative flex gap-5 pb-10 last:pb-0">
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-11 bottom-0 left-[21px] w-px"
                  style={{ background: "var(--border-subtle)" }}
                />
              )}
              <span
                className="flex h-11 w-11 flex-none items-center justify-center"
                style={{
                  fontFamily: "var(--font-numeric)",
                  fontWeight: "var(--fw-display)",
                  fontSize: "var(--fs-h5)",
                  color: "var(--text-on-accent)",
                  background: "var(--gold)",
                  clipPath:
                    "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                }}
              >
                {step.n}
              </span>
              <div className="pt-2">
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: "var(--fw-semibold)",
                    fontSize: "var(--fs-h5)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--ls-heading)",
                    color: "var(--text-heading)",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-body)",
                    color: "var(--text-muted)",
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
