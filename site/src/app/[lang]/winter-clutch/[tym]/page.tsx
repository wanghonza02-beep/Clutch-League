import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crown, Hand } from "lucide-react";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import PlaceholderNotice from "@/components/winter/PlaceholderNotice";
import { WINTER_PREVIEW, previewTeam } from "@/content/winter-clutch-preview";
import { fmt } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, pageTitle } from "@/i18n/server";
import { formatDate } from "@/lib/format";

// Soupisky jsou v datovém souboru, takže se všechny vyrobí předem (statické
// stránky). Neznámý tým = 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return WINTER_PREVIEW.teams.map((t) => ({ tym: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/winter-clutch/[tym]">): Promise<Metadata> {
  const { tym } = await params;
  const t = await getDictionary();
  const team = previewTeam(tym);
  if (!team) return { title: pageTitle(t, t.winter.teamNotFound) };
  return {
    title: fmt(t.winter.teamMetaTitle, { team: team.name, name: WINTER_PREVIEW.name }),
    description: fmt(t.winter.teamMetaDescription, { team: team.name, group: team.group }),
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

export default async function WinterTeamPage({ params }: PageProps<"/[lang]/winter-clutch/[tym]">) {
  const { tym } = await params;
  const team = previewTeam(tym);
  if (!team) notFound();
  const { locale, t: dict } = await getI18n();
  const t = dict.winter;

  const players = [...team.players].sort((a, b) => a.number - b.number);
  const matches = WINTER_PREVIEW.matches
    .filter((m) => m.home === team.slug || m.away === team.slug)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex w-full flex-col gap-[var(--sp-12)]">
        <div>
          {/* Zpět tam, odkud návštěvník přišel (rozpis nebo jiný tým). */}
          <BackButton fallback="/winter-clutch#tymy" />
        </div>

        <header className="flex flex-col gap-[var(--sp-6)]">
          <div className="cl-sectionhead">
            <span className="cl-sectionhead__over">
              {fmt(t.teamOver, { name: WINTER_PREVIEW.name, group: team.group })}
            </span>
            <SplitText
              tag="h1"
              className="cl-display"
              style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
              text={team.name}
              textAlign="left"
            />
          </div>
          <PlaceholderNotice what={t.teamPlaceholderWhat} />
        </header>

        {/* ---- soupiska ---- */}
        <section aria-labelledby="soupiska" className="flex flex-col gap-[var(--sp-6)]">
          <h2 id="soupiska" style={sectionTitle}>
            {t.roster}
          </h2>
          <div className="cl-card">
            <div className="cl-card__in">
              <ul className="cl-card__body" aria-label={fmt(t.playersOf, { team: team.name })}>
                {players.map((p) => (
                  <li key={`${p.number}-${p.name}`} className="roster-row">
                    <span className="roster-row__num cl-num">
                      <span className="sr-only">{t.number}</span>
                      {p.number}
                    </span>
                    <span className="flex flex-col gap-[2px]">
                      <span className="roster-row__name">{p.name}</span>
                      <span className="roster-row__meta">{dict.labels.positions[p.position]}</span>
                    </span>
                    <span className="wcl-roles">
                      {p.captain && (
                        <span className="cl-badge">
                          <Crown size={12} strokeWidth={2} aria-hidden /> {t.captain}
                        </span>
                      )}
                      {p.position === "goalkeeper" && (
                        <span className="cl-badge cl-badge--neutral">
                          <Hand size={12} strokeWidth={2} aria-hidden /> {t.keeper}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---- zápasy týmu ---- */}
        <section aria-labelledby="zapasy-tymu" className="flex flex-col gap-[var(--sp-6)]">
          <h2 id="zapasy-tymu" style={sectionTitle}>
            {t.teamMatches}
          </h2>
          <div className="cl-card">
            <div className="cl-card__in">
              <ul className="cl-card__body" aria-label={fmt(t.teamMatchesOf, { team: team.name })}>
                {matches.map((m) => {
                  const opponent = previewTeam(m.home === team.slug ? m.away : m.home);
                  return (
                    <li key={`${m.date}-${m.time}`} className="roster-row">
                      <span className="flex flex-col gap-[2px]" style={{ minWidth: "110px" }}>
                        <span className="cl-num" style={{ color: "var(--text-heading)" }}>
                          {m.time}
                        </span>
                        <span className="roster-row__meta cl-num">{formatDate(m.date, locale)}</span>
                      </span>
                      <span className="flex flex-col gap-[2px]">
                        <span className="roster-row__name">
                          {opponent ? (
                            <>
                              <span style={{ color: "var(--text-faint)" }}>{t.against}</span>
                              <Link href={`/winter-clutch/${opponent.slug}`} className="wcl-teamlink">
                                {opponent.name}
                              </Link>
                            </>
                          ) : (
                            t.opponentTba
                          )}
                        </span>
                        <span className="roster-row__meta">
                          {m.round} · {fmt(t.groupTitle, { group: m.group })} ·{" "}
                          {m.home === team.slug ? t.homeSide : t.awaySide}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div>
            <Link href="/winter-clutch#rozpis" className="cl-btn cl-btn--ghost cl-btn--sm">
              <span>{t.fullSchedule}</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
