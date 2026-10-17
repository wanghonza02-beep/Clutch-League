import { formatLabel } from "@/i18n/data";
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { phaseBadgeClass } from "@/lib/tournamentModel";
import { loadLandingTournaments } from "@/lib/upcoming";

/**
 * „Další turnaje“ pod kampaní na úvodní stránce: ostatní neodehrané turnaje
 * z Rozpisu turnajů (jen zobrazené na webu), od nejbližšího. Turnaj z kampaně
 * tu není, odehrané jsou v Odehraných zápasech. Bez dalšího turnaje se sekce
 * vůbec neukáže — žádné ukázky ani prázdný rámeček.
 */
export default async function UpcomingTournamentsSection() {
  const [{ locale, t: dict }, { others }] = await Promise.all([getI18n(), loadLandingTournaments()]);
  if (others.length === 0) return null;
  const t = dict.upcoming;

  return (
    <section id="dalsi-turnaje" aria-labelledby="dalsi-turnaje-title" className="cl-section">
      <div className="cl-container flex flex-col gap-[var(--sp-10)]">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.over}</span>
          <h2 id="dalsi-turnaje-title" className="cl-sectionhead__title">
            {t.title}
          </h2>
        </div>

        <ol className="trn-grid" aria-label={t.listLabel}>
          {others.map((tournament) => {
            const details = [tournament.venue, formatLabel(tournament.format, locale)].filter(Boolean);
            const summary = tournament.summary[locale];
            return (
              <li key={tournament.id} className="cl-card">
                <div className="cl-card__in">
                  <div className="trn-card__body">
                    <span>
                      <span className={phaseBadgeClass(tournament.phase)}>
                        {dict.labels.tournamentPhase[tournament.phase]}
                      </span>
                    </span>
                    <h3 className="trn-card__title">{tournament.name}</h3>
                    <span className="trn-card__meta cl-num">
                      <span>
                        {formatDate(tournament.dateIso, locale)}
                        {tournament.startTime && ` · ${tournament.startTime}`}
                      </span>
                      {details.map((detail, i) => (
                        <span key={i}>{detail}</span>
                      ))}
                    </span>
                    {summary && <p className="upcoming-card__summary">{summary}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
