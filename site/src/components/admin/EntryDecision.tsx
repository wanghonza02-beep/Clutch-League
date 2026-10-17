"use client";

import { useActionState, useState } from "react";
import { Check, RotateCcw, Trash2, X } from "lucide-react";
import { showToast } from "@/components/ui/ActionToast";
import Notice from "@/components/ui/Notice";
import { useT } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import LocaleField from "@/i18n/LocaleField";
import { removeEntryAction, setEntryStatusAction } from "@/lib/admin/actions";
import type { EntryStatus } from "@/lib/portal/types";
import { IDLE, type FormState } from "@/lib/portal/validation";

type Mode = "approve" | "pending" | "reject" | "remove";

/**
 * Rozhodnutí o přihlášce. Každý krok, který tým z turnaje vyřadí (zamítnout,
 * vrátit ke schválení, smazat), se nejdřív zeptá a řekne, co se stane —
 * hlavně se zápasy týmu. Schválení je na jedno kliknutí, jen když soupiska
 * nesedí s limity turnaje, se taky zeptá. Na turnaj se startovným jde schválit
 * až po označení „Startovné přijato“ (hlídá i databáze).
 */
export default function EntryDecision({
  tournamentId,
  teamId,
  teamName,
  status,
  matches,
  playedMatches,
  rosterIssue,
  paymentMissing,
}: {
  tournamentId: string;
  teamId: string;
  teamName: string;
  status: EntryStatus;
  matches: number;
  playedMatches: number;
  /** Text, proč soupiska nesedí (prázdné = sedí). */
  rosterIssue: string;
  /** Turnaj má startovné a to ještě není přijaté — schválit zatím nejde. */
  paymentMissing: boolean;
}) {
  const { decision: t, common } = useT();
  const [mode, setMode] = useState<Mode | null>(null);
  // Hláška patří k akci, která běžela naposled.
  const [last, setLast] = useState<"status" | "remove">("status");

  // Po úspěchu se panel zavře; hláška zůstane pod tlačítky.
  const [statusState, statusAction, statusPending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      setLast("status");
      const result = await setEntryStatusAction(prev, formData);
      if (result.status === "ok") {
        setMode(null);
        // Karta může po změně stavu vypadnout z filtru — potvrzení proto mimo ni.
        showToast(`${teamName}: ${result.message}`);
      }
      return result;
    },
    IDLE
  );
  const [removeState, removeAction, removePending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      setLast("remove");
      const result = await removeEntryAction(prev, formData);
      if (result.status === "ok") {
        setMode(null);
        showToast(`${teamName}: ${result.message}`);
      }
      return result;
    },
    IDLE
  );
  const pending = statusPending || removePending;
  const state = last === "remove" ? removeState : statusState;

  const leaves = mode === "reject" || mode === "pending" || mode === "remove";
  const blocked = leaves && playedMatches > 0;
  const needsMatchConfirm = leaves && matches > 0 && !blocked;

  const target: Record<Exclude<Mode, "remove">, EntryStatus> = {
    approve: "approved",
    pending: "pending",
    reject: "rejected",
  };

  const panel = mode && (
    <form
      action={mode === "remove" ? removeAction : statusAction}
      className="decide__panel"
      aria-label={fmt(t.question[mode], { team: teamName })}
    >
      <LocaleField />
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="teamId" value={teamId} />
      {mode !== "remove" && <input type="hidden" name="status" value={target[mode]} />}

      <p className="decide__question">{fmt(t.question[mode], { team: teamName })}</p>
      <p className="decide__effect">{t.effect[mode]}</p>

      {mode === "approve" && rosterIssue && <Notice tone="accent">{rosterIssue}</Notice>}

      {mode === "reject" && (
        <div className="cl-field">
          <label htmlFor={`reason-${teamId}`} className="cl-field__label">
            {t.reasonLabel}
          </label>
          <textarea
            id={`reason-${teamId}`}
            // Panel se otevřel kliknutím — kurzor rovnou do důvodu.
            autoFocus
            name="note"
            maxLength={500}
            rows={3}
            className="cl-field__textarea"
            aria-describedby={`reason-${teamId}-hint`}
            defaultValue={statusState.values?.note ?? ""}
          />
          <span id={`reason-${teamId}-hint`} className="cl-field__hint">
            {t.reasonHint}
          </span>
        </div>
      )}

      {blocked && <Notice tone="error">{fmt(t.hasResults, { n: playedMatches })}</Notice>}

      {needsMatchConfirm && (
        <label className="cl-check decide__confirm">
          <input type="checkbox" name="deleteMatches" required />
          {fmt(t.deleteMatches, { n: matches })}
        </label>
      )}

      <div className="adm-actions">
        <button
          type="submit"
          className={`cl-btn cl-btn--sm ${mode === "approve" ? "cl-btn--primary" : "cl-btn--secondary"}${pending ? " cl-btn--loading" : ""}`}
          disabled={blocked}
          aria-busy={pending || undefined}
          autoFocus={mode !== "reject"}
        >
          <span className="cl-btn-label">{t.confirm[mode]}</span>
        </button>
        <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={() => setMode(null)}>
          <span>{common.cancel}</span>
        </button>
      </div>
    </form>
  );

  return (
    <div className="decide">
      {panel || (
        <div className="adm-actions">
          {status !== "approved" &&
            (paymentMissing ? (
              <button
                type="button"
                className="cl-btn cl-btn--primary cl-btn--sm"
                disabled
                aria-describedby={`pay-hint-${teamId}`}
              >
                <Check size={14} strokeWidth={2.5} aria-hidden />
                <span>{t.approve}</span>
              </button>
            ) : rosterIssue ? (
              <button type="button" className="cl-btn cl-btn--primary cl-btn--sm" onClick={() => setMode("approve")}>
                <Check size={14} strokeWidth={2.5} aria-hidden />
                <span>{t.approve}</span>
              </button>
            ) : (
              // Soupiska sedí — schválit jde rovnou.
              <form action={statusAction}>
                <LocaleField />
                <input type="hidden" name="tournamentId" value={tournamentId} />
                <input type="hidden" name="teamId" value={teamId} />
                <input type="hidden" name="status" value="approved" />
                <button
                  type="submit"
                  className={`cl-btn cl-btn--primary cl-btn--sm${pending ? " cl-btn--loading" : ""}`}
                  aria-busy={pending || undefined}
                >
                  <Check size={14} strokeWidth={2.5} aria-hidden />
                  <span className="cl-btn-label">{t.approve}</span>
                </button>
              </form>
            ))}
          {status === "approved" && (
            <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm cl-btn--flush" onClick={() => setMode("pending")}>
              <RotateCcw size={14} strokeWidth={2} aria-hidden />
              <span>{t.toPending}</span>
            </button>
          )}
          {status !== "rejected" && (
            <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={() => setMode("reject")}>
              <X size={14} strokeWidth={2} aria-hidden />
              <span>{t.reject}</span>
            </button>
          )}
          {status === "rejected" && (
            <>
              <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={() => setMode("pending")}>
                <RotateCcw size={14} strokeWidth={2} aria-hidden />
                <span>{t.toPending}</span>
              </button>
              <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={() => setMode("remove")}>
                <Trash2 size={14} strokeWidth={2} aria-hidden />
                <span>{t.remove}</span>
              </button>
            </>
          )}
        </div>
      )}

      {!panel && status !== "approved" && paymentMissing && (
        <p id={`pay-hint-${teamId}`} className="adm-meta">
          {t.needsPayment}
        </p>
      )}

      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}
    </div>
  );
}
