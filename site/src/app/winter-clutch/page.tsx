import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import BackButton from "@/components/BackButton";
import Notice from "@/components/ui/Notice";
import SplitText from "@/components/ui/SplitText";
import PlaceholderNotice from "@/components/winter/PlaceholderNotice";
import { CAMPAIGN } from "@/content/campaign";
import {
  WINTER_PREVIEW,
  previewDates,
  previewGroups,
  previewRounds,
  previewTeam,
} from "@/content/winter-clutch-preview";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: `${WINTER_PREVIEW.name} — rozpis a týmy | Clutch League`,
  description: `Kdo s kým hraje, kdy a v jaké skupině. Soupisky všech týmů ${WINTER_PREVIEW.name}.`,
};

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

function TeamLink({ slug, align }: { slug: string; align?: "right" }) {
  const team = previewTeam(slug);
  if (!team) return <span style={{ color: "var(--text-faint)" }}>Neznámý tým</span>;
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

export default function WinterClutchPage() {
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
            <span className="cl-sectionhead__over">{CAMPAIGN.label}</span>
            <SplitText
              tag="h1"
              className="cl-display"
              style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
              text={WINTER_PREVIEW.name}
              textAlign="left"
            />
            <p className="cl-sectionhead__sub">
              Kdo s kým hraje, kdy a v jaké skupině.
              {announced && " Klikni na tým a uvidíš jeho soupisku."}
            </p>
          </div>

          <PlaceholderNotice what="Týmy, hráči i časy zápasů" />

          {!announced && (
            <>
              <Notice tone="info">
                Rozpis zápasů a soupisky týmů zveřejníme po uzávěrce přihlášek.
              </Notice>
              <div>
                <Link href="/prihlasit-tym" className="cl-btn cl-btn--primary">
                  <span>Přihlásit tým</span>
                  <ArrowRight size={16} strokeWidth={2} aria-hidden />
                </Link>
              </div>
            </>
          )}

          {announced && (
            <dl className="hist-timeline__stats">
              <div className="cl-stat">
                <dt className="cl-stat__label">{dates.length > 1 ? "Hrací dny" : "Datum"}</dt>
                <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
                  {dates.map(formatDate).join(", ")}
                </dd>
              </div>
              <div className="cl-stat">
                <dt className="cl-stat__label">Místo</dt>
                <dd className="cl-stat__val order-first" style={{ fontSize: "var(--fs-h5)" }}>
                  {WINTER_PREVIEW.venue || "Upřesníme"}
                </dd>
              </div>
              <div className="cl-stat">
                <dt className="cl-stat__label">Týmů</dt>
                <dd className="cl-stat__val order-first">{WINTER_PREVIEW.teams.length}</dd>
              </div>
              <div className="cl-stat cl-stat--accent">
                <dt className="cl-stat__label">Zápasů</dt>
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
                <span className="cl-sectionhead__over">Rozpis</span>
                <h2 id="rozpis" style={sectionTitle}>
                  Kdo s kým a kdy
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
                              <th scope="col">Výkop</th>
                              <th scope="col">Skupina</th>
                              <th scope="col" className="text-right">
                                Domácí
                              </th>
                              <th scope="col" className="text-center">
                                <span className="sr-only">proti</span>
                              </th>
                              <th scope="col">Hosté</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matches.map((m) => (
                              <tr key={`${m.date}-${m.time}-${m.home}-${m.away}`}>
                                <td className="cl-num" style={{ whiteSpace: "nowrap" }}>
                                  <span style={{ color: "var(--text-heading)" }}>{m.time}</span>{" "}
                                  <span style={{ color: "var(--text-faint)" }}>{formatDate(m.date)}</span>
                                </td>
                                <td>
                                  <span className="cl-badge cl-badge--neutral">{m.group}</span>
                                </td>
                                <td className="cl-table__team text-right">
                                  <TeamLink slug={m.home} align="right" />
                                </td>
                                <td className="text-center">
                                  <span className="cl-score cl-score__sep" aria-hidden>
                                    vs
                                  </span>
                                </td>
                                <td className="cl-table__team">
                                  <TeamLink slug={m.away} />
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
                <span className="cl-sectionhead__over">Týmy</span>
                <h2 id="tymy-title" style={sectionTitle}>
                  Skupiny a soupisky
                </h2>
              </div>
              {groups.map(({ group, teams }) => (
                <div key={group} className="flex flex-col gap-[var(--sp-4)]">
                  <h3 className="adm-sub">Skupina {group}</h3>
                  <ul className="wcl-teams" aria-label={`Týmy skupiny ${group}`}>
                    {teams.map((team) => {
                      const captain = team.players.find((p) => p.captain);
                      return (
                        <li key={team.slug} className="cl-card cl-card--interactive">
                          <div className="cl-card__in">
                            <Link href={`/winter-clutch/${team.slug}`} className="wcl-teamcard">
                              <span className="adm-item__title">{team.name}</span>
                              <span className="roster-row__meta">
                                {team.players.length} hráčů
                                {captain && (
                                  <>
                                    {" "}
                                    · <Crown size={12} strokeWidth={2} aria-hidden style={{ display: "inline" }} />{" "}
                                    kapitán {captain.name}
                                  </>
                                )}
                              </span>
                              <span className="wcl-teamcard__go">
                                Soupiska <ArrowRight size={14} strokeWidth={2} aria-hidden />
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
