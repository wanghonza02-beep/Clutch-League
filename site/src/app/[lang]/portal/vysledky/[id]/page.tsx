import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PortalHeader from "@/components/portal/PortalHeader";
import MatchResultForm from "@/components/admin/MatchResultForm";
import { stageLabel } from "@/i18n/data";
import { fmt } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { getMatchForResult } from "@/lib/admin/data";
import { maxMinute } from "@/lib/admin/result";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.matchMetaTitle) };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PortalVysledekZapasu({ params }: PageProps<"/[lang]/portal/vysledky/[id]">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const { id } = await params;
  const match = UUID.test(id) ? await getMatchForResult(id) : null;
  if (!match) notFound();

  return (
    <>
      <div>
        <Link href={`/portal/vysledky?turnaj=${match.tournament.id}`} className="cl-btn cl-btn--ghost cl-btn--sm cl-back">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          <span>{t.tournamentMatches}</span>
        </Link>
      </div>

      <PortalHeader
        over={`${match.tournament.name} · ${stageLabel(match.stage, dict)}`}
        title={
          <>
            {match.home.name} <span aria-hidden>–</span>
            <span className="sr-only"> {dict.common.versus} </span> {match.away.name}
          </>
        }
        sub={
          <>
            <span className="cl-num">{formatDateTime(match.kickoff, locale)}</span>
            {match.clutchMode && <> · {fmt(t.clutchMode, { mode: match.clutchMode })}</>}
          </>
        }
      />

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
