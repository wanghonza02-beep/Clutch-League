import { Quote, Star } from "lucide-react";
import SplitText from "@/components/ui/SplitText";

type Review = {
  name: string;
  role: string;
  quote: string;
};

// ⚠️ UKÁZKOVÉ RECENZE (placeholder): nahraď skutečnými, schválenými citacemi
// hráčů před spuštěním webu (viz PRED-SPUSTENIM.md).
const REVIEWS: Review[] = [
  {
    name: "Tomáš K.",
    role: "Kapitán týmu",
    quote:
      "Organizace na jedničku. Harmonogram seděl na minutu, rozhodčí byli v obraze a nikdo nečekal hodinu na další zápas. Takhle si amatérský turnaj představuju.",
  },
  {
    name: "Ondřej V.",
    role: "Brankář",
    quote:
      "Clutch Time je chaos v tom nejlepším smyslu. Padlo No Hands a já tři minuty chytal jen nohama. Tolik adrenalinu jsem v brance ještě nezažil.",
  },
  {
    name: "Jakub M.",
    role: "Útočník",
    quote:
      "Hraje se naplno, ale férově. Rozhodčí pískali v klidu a jasně, žádné zbytečné hádky. Po zápase jsme si se soupeřem podali ruce a šli spolu na pivo.",
  },
  {
    name: "Adam Š.",
    role: "Kapitán týmu",
    quote:
      "Přihláška přes Instagram zabrala pět minut a všechny info nám přišly včas. Na místě bylo připravené všechno, od rozlišováků po náhradní míče u branek.",
  },
  {
    name: "Marek D.",
    role: "Hráč v poli",
    quote:
      "Úroveň byla vyrovnaná, skoro každý zápas se lámal v posledních minutách. Kostka ti dokáže otočit výsledek, takže nic není rozhodnuté do konce.",
  },
  {
    name: "Filip H.",
    role: "Záložník",
    quote:
      "Skvělá atmosféra kolem hřiště, lidi fandili i cizím týmům. Na Winter Clutch jdeme zas, tentokrát si pro ten pohár dojdeme.",
  },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function Stars() {
  return (
    <div className="testi-stars" role="img" aria-label="Hodnocení 5 z 5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={16} strokeWidth={0} fill="currentColor" aria-hidden />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section
      id="proc-clutch-league"
      aria-labelledby="proc-clutch-league-title"
      className="cl-section border-t border-[var(--border-subtle)]"
    >
      <div className="cl-container">
        <div
          className="cl-sectionhead cl-sectionhead--center"
          style={{ marginBottom: "var(--sp-12)" }}
        >
          <span className="cl-sectionhead__over">Co o nás říkají hráči</span>
          <SplitText
            tag="h2"
            id="proc-clutch-league-title"
            className="cl-sectionhead__title"
            text="Proč zrovna Clutch League"
            splitType="words"
            delay={90}
          />
          <p className="cl-sectionhead__sub">
            Organizace, souboje, fair play a parta kolem hřiště. Tohle si z Clutch League
            odnesli hráči z prvního turnaje.
          </p>
        </div>

        <ul className="testi-grid">
          {REVIEWS.map((review) => (
            <li key={review.name} className="testi-wrap">
              <figure className="cl-card testi-card">
                <div className="cl-card__in">
                  <span className="cl-card__raster" aria-hidden />
                  <div className="cl-card__body testi-card__body">
                    <div className="flex items-start justify-between gap-4">
                      <Stars />
                      <Quote size={28} className="testi-card__mark" aria-hidden />
                    </div>

                    <blockquote className="testi-card__quote">
                      <p>„{review.quote}“</p>
                    </blockquote>

                    <figcaption className="testi-card__author">
                      <span className="testi-card__avatar" aria-hidden>
                        {initials(review.name)}
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="testi-card__name">{review.name}</span>
                        <span className="testi-card__role">{review.role}</span>
                      </span>
                    </figcaption>
                  </div>
                </div>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
