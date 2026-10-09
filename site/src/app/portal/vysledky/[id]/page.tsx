import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import MatchResultForm from "@/components/admin/MatchResultForm";
import { getMatchForResult } from "@/lib/admin/data";
import { maxMinute } from "@/lib/admin/result";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: "Výsledek zápasu | Portál Clutch League",
};

const h1Style = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-display)",
  fontStyle: "italic",
  fontSize: "var(--fs-h2)",
  lineHeight: "var(--lh-heading)",
  letterSpacing: "var(--ls-display)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
  margin: 0,
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PortalVysledekZapasu({ params }: PageProps<"/portal/vysledky/[id]">) {
  await requireRole("admin");
  const { id } = await params;
  const match = UUID.test(id) ? await getMatchForResult(id) : null;
  if (!match) notFound();

  return (
    <>
      <div>
        <Link href={`/portal/vysledky?turnaj=${match.tournament.id}`} className="cl-btn cl-btn--ghost cl-btn--sm cl-back">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          <span>Zápasy turnaje</span>
        </Link>
      </div>

      <header className="cl-sectionhead">
        <span className="cl-sectionhead__over">
          {match.tournament.name} · {match.stage}
        </span>
        <h1 style={h1Style}>
          {match.home.name} <span aria-hidden>–</span>
          <span className="sr-only"> proti </span> {match.away.name}
        </h1>
        <p className="cl-sectionhead__sub">
          <span className="cl-num">{formatDateTime(match.kickoff)}</span>
          {match.clutchMode && <> · Clutch Time: {match.clutchMode}</>}
        </p>
      </header>

      <div className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body">
            <MatchResultForm
              matchId={match.id}
              home={match.home}
              away={match.away}
              initialHome={match.homeGoals}
              initialAway={match.awayGoals}
              initialEvents={match.events}
              limit={maxMinute(match.tournament.matchLength)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
