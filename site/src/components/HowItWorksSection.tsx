import RulesSection from "@/components/RulesSection";
import ScrollSwapStack from "@/components/ui/ScrollSwapStack";
import { getDictionary } from "@/i18n/server";

/**
 * „Jak funguje Clutch League?“ + pravidla v jedné sekci. Navigace na ni vede
 * přes „Pravidla“.
 *
 * Od lg (≥ 1024 px) dva sloupce, obojí přilepené pod lištou (CSS sticky):
 *   1. Vlevo krátké řádky přes celou výšku okna, vpravo pravidla.
 *   2. Při scrollu přeběhne textem shora dolů vlna přerolování (ScrollSwapStack).
 *   3. Prodleva: všechno chvíli stojí, pak sekce odjede a stránka pokračuje.
 *   Délky drží .hiw__swap a .hiw__hold v globals.css.
 * Pod lg jeden sloupec: text, pod ním pravidla, nic se nepřilepuje.
 *
 * Kotvy: #jak-to-funguje = začátek sekce, #pravidla = buňka s pravidly
 * (na počítači začíná nahoře u sekce, na mobilu pod textem). Kotva je na
 * buňce, ne na přilepeném bloku — jeho poloha se při scrollu mění.
 */
export default async function HowItWorksSection() {
  const t = (await getDictionary()).scrolly;

  return (
    <section id="jak-to-funguje" aria-labelledby="jak-to-funguje-title" className="hiw">
      {/* Text pro čtečky jen jednou; viditelné řádky jsou aria-hidden. */}
      <h2 id="jak-to-funguje-title" className="sr-only">
        {[...t.run, ...t.ask, ...t.answer].join(" ")}
      </h2>

      <div className="cl-container hiw__grid">
        <ScrollSwapStack groups={[{ rows: t.run }, { rows: t.ask }, { rows: t.answer, accent: true }]} />

        <div id="pravidla" className="hiw__rules">
          <div className="hiw__sticky">
            <RulesSection />
          </div>
        </div>
      </div>
    </section>
  );
}
