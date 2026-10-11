import { Quote, Star } from "lucide-react";
import SplitText from "@/components/ui/SplitText";
import { REVIEWS } from "@/content/reviews";
import { getDictionary } from "@/i18n/server";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function Stars({ label }: { label: string }) {
  return (
    <div className="testi-stars" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={16} strokeWidth={0} fill="currentColor" aria-hidden />
      ))}
    </div>
  );
}

export default async function TestimonialsSection() {
  // Bez skutečných recenzí se sekce neukazuje (viz src/content/reviews.ts).
  if (REVIEWS.length === 0) return null;
  const t = (await getDictionary()).testimonials;

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
          <span className="cl-sectionhead__over">{t.over}</span>
          <SplitText
            tag="h2"
            id="proc-clutch-league-title"
            className="cl-sectionhead__title"
            text={t.title}
            splitType="words"
            delay={90}
          />
          <p className="cl-sectionhead__sub">{t.sub}</p>
        </div>

        <ul className="testi-grid">
          {REVIEWS.map((review) => (
            <li key={review.name} className="testi-wrap">
              <figure className="cl-card testi-card">
                <div className="cl-card__in">
                  <span className="cl-card__raster" aria-hidden />
                  <div className="cl-card__body testi-card__body">
                    <div className="flex items-start justify-between gap-4">
                      <Stars label={t.stars} />
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
