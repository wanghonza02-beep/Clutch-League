import type { Metadata } from "next";
import { ArrowRight, Crown } from "lucide-react";
import BackButton from "@/components/BackButton";
import Notice from "@/components/ui/Notice";
import SplitText from "@/components/ui/SplitText";
import PlaceholderNotice from "@/components/winter/PlaceholderNotice";
import {
  WINTER_PREVIEW,
  previewDates,
  previewGroups,
  previewRounds,
  previewTeam,
} from "@/content/winter-clutch-preview";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, pageTitle } from "@/i18n/server";
import { formatDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: pageTitle(t, fmt(t.winter.metaTitle, { name: WINTER_PREVIEW.name })),
    description: fmt(t.winter.metaDescription, { name: WINTER_PREVIEW.name }),
  };
}

const sectionTitle = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-display)",
  fontStyle: "italic",
  fontSize: "var(--fs-h3)",
  lineHeight: "var(--lh-heading)",
  letterSpacing: "var(--ls-display)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
  margin: 0,
} as const;

function TeamLink({ slug, align, unknown }: { slug: string; align?: "right"; unknown: string }) {
  const team = previewTeam(slug);
  if (!team) return <span style={{ color: "var(--text-faint)" }}>{unknown}</span>;
  return (
    <Link
      href={`/winter-clutch/${team.slug}`}
      className="wcl-teamlink"
      style={align === "right" ? { justifyContent: "flex-end" } : undefined}
    >
      {team.name}
    </Link>
  );
}

export default async function WinterClutchPage() {
  const { locale, t: dict } = await getI18n();
  const t = dict.winter;
  const rounds = previewRounds();
  const groups = previewGroups();
  const dates = previewDates();
  // Rozpis a soupisky se zveřejní po uzávěrce přihlášek; do té doby jen oznámení.
  const announced = WINTER_PREVIEW.teams.length > 0;

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container flex flex-col gap-[var(--sp-12)]">
        <div>
          <BackButton />
        </div>

        {/* ---- hlavička ---- */}
        <header className="flex flex-col gap-[var(--sp-6)]">
          <div className="cl-sectionhead">
            <span className="cl-sectionhead__over">{dict.rules.campaignOver}</span>
            <SplitText
              tag="h1"
              className="cl-display"
              style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
              text={WINTER_PREVIEW.name}
              textAlign="left"
            />
            <p className="cl-sectionhead__sub">
              {t.sub}
              {announced && t.subTeams}
            </p>
          </div>

          <PlaceholderNotice what={t.placeholderWhat} />

          {!announced && (
            <>
              <Notice tone="info">{t.soon}</Notice>
              <div>
                <Link href="/prihlasit-tym" className="cl-btn cl-btn--primary">
                  <span>{dict.common.registerTeam}</span>
                  <ArrowRight size={16} strokeWidth={2} aria-hidden />
                </Link>
              </div>
            </>
          )}

          {announced && (
            <dl className="hist-timeline__stats">
              <div className="cl-stat">
                <dt className="cl-stat__label">{dates.length > 1 ? t.days : t.date}</dt>
                <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
                  {dates.map((d) => formatDate(d, locale)).join(", ")}
                </dd>
              </div>
              <div className="cl-stat">
                <dt className="cl-stat__label">{t.venue}</dt>
                <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
                  {WINTER_PREVIEW.venue || t.tba}
                </dd>
              </div>
              <div className="cl-stat">
                <dt className="cl-stat__label">{t.teams}</dt>
                <dd className="cl-stat__val order-first">{WINTER_PREVIEW.teams.length}</dd>
              </div>
              <div className="cl-stat cl-stat--accent">
                <dt className="cl-stat__label">{t.matches}</dt>
                <dd className="cl-stat__val order-first">{WINTER_PREVIEW.matches.length}</dd>
              </div>
            </dl>
          )}
        </header>

        {announced && (
          <>
            {/* ---- rozpis po kolech ---- */}
            <section aria-labelledby="rozpis" className="flex flex-col gap-[var(--sp-6)]">
              <div className="cl-sectionhead">
                <span className="cl-sectionhead__over">{t.scheduleOver}</span>
                <h2 id="rozpis" style={sectionTitle}>
                  {t.scheduleTitle}
                </h2>
              </div>
              <div className="cl-card">
                <div className="cl-card__in">
                  <div className="cl-card__body flex flex-col gap-[var(--sp-8)]">
                    {rounds.map(({ round, matches }) => (
                      <div key={round} className="cl-tablewrap">
                        <table className="cl-table" style={{ minWidth: "520px", tableLayout: "fixed" }}>
                          <caption>{round}</caption>
                          {/* Stejné šířky sloupců ve všech kolech, ať lícují pod sebou. */}
                          <colgroup>
                            <col style={{ width: "22%" }} />
                            <col style={{ width: "14%" }} />
                            <col style={{ width: "27%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "27%" }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th scope="col">{t.kickoff}</th>
                              <th scope="col">{t.group}</th>
                              <th scope="col" className="text-right">
                                {t.home}
                              </th>
                              <th scope="col" className="text-center">
                                <span className="sr-only">{dict.common.versus}</span>
                              </th>
                              <th scope="col">{t.away}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matches.map((m) => (
                              <tr key={`${m.date}-${m.time}-${m.home}-${m.away}`}>
                                <td className="cl-num" style={{ whiteSpace: "nowrap" }}>
                                  <span style={{ color: "var(--text-heading)" }}>{m.time}</span>{" "}
                                  <span style={{ color: "var(--text-faint)" }}>{formatDate(m.date, locale)}</span>
                                </td>
                                <td>
                                  <span className="cl-badge cl-badge--neutral">{m.group}</span>
                                </td>
                                <td className="cl-table__team text-right">
                                  <TeamLink slug={m.home} align="right" unknown={dict.common.unknownTeam} />
                                </td>
                                <td className="text-center">
                                  <span className="cl-score cl-score__sep" aria-hidden>
                                    {t.vs}
                                  </span>
                                </td>
                                <td className="cl-table__team">
                                  <TeamLink slug={m.away} unknown={dict.common.unknownTeam} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ---- týmy po skupinách ---- */}
            <section aria-labelledby="tymy-title" id="tymy" className="flex flex-col gap-[var(--sp-6)]">
              <div className="cl-sectionhead">
                <span className="cl-sectionhead__over">{t.teamsOver}</span>
                <h2 id="tymy-title" style={sectionTitle}>
                  {t.teamsTitle}
                </h2>
              </div>
              {groups.map(({ group, teams }) => (
                <div key={group} className="flex flex-col gap-[var(--sp-4)]">
                  <h3 className="adm-sub">{fmt(t.groupTitle, { group })}</h3>
                  <ul className="wcl-teams" aria-label={fmt(t.groupTeams, { group })}>
                    {teams.map((team) => {
                      const captain = team.players.find((p) => p.captain);
                      return (
                        <li key={team.slug} className="cl-card cl-card--interactive">
                          <div className="cl-card__in">
                            <Link href={`/winter-clutch/${team.slug}`} className="wcl-teamcard">
                              <span className="adm-item__title">{team.name}</span>
                              <span className="roster-row__meta">
                                {plural(locale, team.players.length, dict.counts.players)}
                                {captain && (
                                  <>
                                    {" "}
                                    · <Crown size={12} strokeWidth={2} aria-hidden style={{ display: "inline" }} />{" "}
                                    {fmt(t.captainOf, { name: captain.name })}
                                  </>
                                )}
                              </span>
                              <span className="wcl-teamcard__go">
                                {t.roster} <ArrowRight size={14} strokeWidth={2} aria-hidden />
                              </span>
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
