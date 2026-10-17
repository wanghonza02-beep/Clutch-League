import Link from "@/i18n/Link";
import { getDictionary } from "@/i18n/server";

/**
 * „Jak funguje Clutch League?“ na úvodní stránce: tři věty přes celou šířku
 * okna, bez animací, a pod nimi uprostřed velké tlačítko „Pravidla“ na
 * stránku /pravidla. Velikost písma je v globals.css (.hiw).
 *
 * Kotvy: #jak-to-funguje = začátek sekce (vede na ni „Více informací“ v úvodu),
 * #pravidla = tlačítko, ať fungují starší odkazy /#pravidla.
 */
export default async function HowItWorksSection() {
  const { howItWorks: t, rules } = await getDictionary();

  return (
    <section id="jak-to-funguje" aria-labelledby="jak-to-funguje-title" className="hiw">
      <div className="hiw__body">
        <h2 id="jak-to-funguje-title" className="hiw__lines cl-display">
          <span className="hiw__line">{t.run}</span>{" "}
          <span className="hiw__line">{t.ask}</span>{" "}
          <span className="hiw__line hiw__line--accent">{t.answer}</span>
        </h2>

        <div id="pravidla">
          <Link href="/pravidla" className="cl-btn cl-btn--primary cl-btn--lg hiw__cta">
            <span>{rules.title}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
