import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import PortalHeader from "@/components/portal/PortalHeader";
import MatchResultForm from "@/components/admin/MatchResultForm";
import { stageLabel } from "@/i18n/data";
import { fmt } from "@/i18n/format";
import { getDictionary, getI18n, localeHref, portalTitle } from "@/i18n/server";
import { getMatchForResult } from "@/lib/admin/data";
import { maxMinute } from "@/lib/admin/result";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.matchMetaTitle) };
}

/** Zápis výsledku jednoho zápasu (z výsledků turnaje nebo z rozpisu v detailu turnaje). */
export default async function VysledekZapasu({ params }: PageProps<"/[lang]/portal/vysledky/[turnaj]/[zapas]">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const { turnaj, zapas } = await params;
  const match = await getMatchForResult(zapas);
  if (!match) notFound();
  // Zápas z jiného turnaje: správná adresa, ať „Zpět“ vede k jeho turnaji.
  if (match.tournament.id !== turnaj) redirect(await localeHref(`/portal/vysledky/${match.tournament.id}/${match.id}`));

  return (
    <>
      <div>
        <BackButton fallback={`/portal/vysledky/${match.tournament.id}`} />
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
