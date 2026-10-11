import type { Metadata } from "next";
import { Check, Undo2, X } from "lucide-react";
import PortalHeader from "@/components/portal/PortalHeader";
import ActionForm, { SubmitButton } from "@/components/ui/ActionForm";
import Notice from "@/components/ui/Notice";
import { fmt, plural } from "@/i18n/format";
import { rich } from "@/i18n/rich";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { removeEntryAction, setEntryStatusAction } from "@/lib/admin/actions";
import { listPendingTournamentEntries } from "@/lib/admin/data";
import { formatDate, formatPhone } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.entriesMetaTitle) };
}

export default async function PortalPrihlasky() {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const entries = await listPendingTournamentEntries();
  const pending = entries.filter((e) => e.status === "pending").length;

  return (
    <>
      <PortalHeader
        over={t.over}
        title={t.entriesTitle}
        sub={`${pending > 0 ? plural(locale, pending, t.entriesPending) : t.entriesDone} ${t.entriesApprovedNote}`}
      />

      {entries.length === 0 ? (
        <Notice tone="info">{t.entriesEmpty}</Notice>
      ) : (
        <div className="cl-card">
          <div className="cl-card__in">
            <ul className="cl-card__body" aria-label={t.entriesTitle}>
              {entries.map((e) => (
                <li key={`${e.tournamentId}-${e.teamId}`} className="adm-item">
                  <div className="adm-item__head">
                    <span className="adm-item__title">{e.teamName}</span>
                    <span className={e.status === "approved" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                      {dict.labels.entryStatus[e.status]}
                    </span>
                  </div>

                  <div className="adm-meta">
                    <span>
                      {e.tournamentName} · <span className="cl-num">{formatDate(e.startsOn, locale)}</span>
                    </span>
                    {e.city && <span>{e.city}</span>}
                    <span>{fmt(t.onRoster, { count: plural(locale, e.playerCount, dict.counts.players) })}</span>
                    <span>{rich(t.code, { code: <span className="cl-num">{e.code}</span> })}</span>
                  </div>

                  {e.captain ? (
                    <div className="adm-meta">
                      <span>{fmt(t.captainOf, { name: e.captain.name })}</span>
                      <a href={`mailto:${e.captain.email}`}>{e.captain.email}</a>
                      {e.captain.phone && <a href={`tel:${e.captain.phone}`}>{formatPhone(e.captain.phone)}</a>}
                    </div>
                  ) : (
                    <div className="adm-meta">
                      <span>{t.noCaptain}</span>
                    </div>
                  )}

                  {e.note && (
                    <p className="adm-meta" style={{ margin: 0 }}>
                      {fmt(t.note, { note: e.note })}
                    </p>
                  )}

                  <div className="adm-actions">
                    <ActionForm
                      action={setEntryStatusAction}
                      idPrefix={`st-${e.teamId}`}
                      hidden={{
                        tournamentId: e.tournamentId,
                        teamId: e.teamId,
                        status: e.status === "approved" ? "pending" : "approved",
                      }}
                      className="flex flex-col gap-[var(--sp-2)]"
                    >
                      {e.status === "approved" ? (
                        <SubmitButton
                          variant="ghost"
                          size="sm"
                          flush
                          icon={<Undo2 size={14} strokeWidth={2} aria-hidden />}
                        >
                          {t.unapprove}
                        </SubmitButton>
                      ) : (
                        <SubmitButton size="sm" icon={<Check size={14} strokeWidth={2.5} aria-hidden />}>
                          {t.approve}
                        </SubmitButton>
                      )}
                    </ActionForm>

                    <ActionForm
                      action={removeEntryAction}
                      idPrefix={`rm-${e.teamId}`}
                      hidden={{ tournamentId: e.tournamentId, teamId: e.teamId }}
                      className="flex flex-col gap-[var(--sp-2)]"
                    >
                      <SubmitButton
                        variant="ghost"
                        size="sm"
                        confirm={t.rejectConfirm}
                        icon={<X size={14} strokeWidth={2} aria-hidden />}
                      >
                        {t.reject}
                      </SubmitButton>
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
