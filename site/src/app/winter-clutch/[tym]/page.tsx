import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown, Hand } from "lucide-react";
import SplitText from "@/components/ui/SplitText";
import PlaceholderNotice from "@/components/winter/PlaceholderNotice";
import { WINTER_PREVIEW, previewTeam } from "@/content/winter-clutch-preview";
import { formatDate } from "@/lib/format";
import { POSITION_LABEL } from "@/lib/portal/types";

// Soupisky jsou v datovém souboru, takže se všechny vyrobí předem (statické
// stránky). Neznámý tým = 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return WINTER_PREVIEW.teams.map((t) => ({ tym: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/winter-clutch/[tym]">): Promise<Metadata> {
  const { tym } = await params;
  const team = previewTeam(tym);
  if (!team) return { title: "Tým nenalezen | Clutch League" };
  return {
    title: `${team.name} — soupiska | ${WINTER_PREVIEW.name}`,
    description: `Soupiska a zápasy týmu ${team.name} ve skupině ${team.group}.`,
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

export default async function WinterTeamPage({ params }: PageProps<"/winter-clutch/[tym]">) {
  const { tym } = await params;
  const team = previewTeam(tym);
  if (!team) notFound();

  const players = [...team.players].sort((a, b) => a.number - b.number);
  const matches = WINTER_PREVIEW.matches
    .filter((m) => m.home === team.slug || m.away === team.slug)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex w-full flex-col gap-[var(--sp-12)]">
        <div>
          <Link href="/winter-clutch#tymy" className="cl-btn cl-btn--ghost cl-btn--sm cl-back">
            <ArrowLeft size={16} strokeWidth={2} aria-hidden />
            <span>Všechny týmy</span>
          </Link>
        </div>

        <header className="flex flex-col gap-[var(--sp-6)]">
          <div className="cl-sectionhead">
            <span className="cl-sectionhead__over">
              {WINTER_PREVIEW.name} · Skupina{" "}
              {team.group}
            </span>
            <SplitText
              tag="h1"
              className="cl-display"
              style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
              text={team.name}
              textAlign="left"
            />
          </div>
          <PlaceholderNotice what="Název týmu i jména hráčů" />
        </header>

        {/* ---- soupiska ---- */}
        <section aria-labelledby="soupiska" className="flex flex-col gap-[var(--sp-6)]">
          <h2 id="soupiska" style={sectionTitle}>
            Soupiska
          </h2>
          <div className="cl-card">
            <div className="cl-card__in">
              <ul className="cl-card__body" aria-label={`Hráči týmu ${team.name}`}>
                {players.map((p) => (
                  <li key={`${p.number}-${p.name}`} className="roster-row">
                    <span className="roster-row__num cl-num">
                      <span className="sr-only">Číslo </span>
                      {p.number}
                    </span>
                    <span className="flex flex-col gap-[2px]">
                      <span className="roster-row__name">{p.name}</span>
                      <span className="roster-row__meta">{POSITION_LABEL[p.position]}</span>
                    </span>
                    <span className="wcl-roles">
                      {p.captain && (
                        <span className="cl-badge">
                          <Crown size={12} strokeWidth={2} aria-hidden /> Kapitán
                        </span>
                      )}
                      {p.position === "goalkeeper" && (
                        <span className="cl-badge cl-badge--neutral">
                          <Hand size={12} strokeWidth={2} aria-hidden /> Brankář
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
            Zápasy týmu
          </h2>
          <div className="cl-card">
            <div className="cl-card__in">
              <ul className="cl-card__body" aria-label={`Zápasy týmu ${team.name}`}>
                {matches.map((m) => {
                  const opponent = previewTeam(m.home === team.slug ? m.away : m.home);
                  return (
                    <li key={`${m.date}-${m.time}`} className="roster-row">
                      <span className="flex flex-col gap-[2px]" style={{ minWidth: "110px" }}>
                        <span className="cl-num" style={{ color: "var(--text-heading)" }}>
                          {m.time}
                        </span>
                        <span className="roster-row__meta cl-num">{formatDate(m.date)}</span>
                      </span>
                      <span className="flex flex-col gap-[2px]">
                        <span className="roster-row__name">
                          {opponent ? (
                            <>
                              <span style={{ color: "var(--text-faint)" }}>proti </span>
                              <Link href={`/winter-clutch/${opponent.slug}`} className="wcl-teamlink">
                                {opponent.name}
                              </Link>
                            </>
                          ) : (
                            "Soupeř upřesníme"
                          )}
                        </span>
                        <span className="roster-row__meta">
                          {m.round} · Skupina {m.group} · {m.home === team.slug ? "domácí" : "hosté"}
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
              <span>Celý rozpis turnaje</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
