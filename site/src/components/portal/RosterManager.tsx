"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import Notice from "@/components/ui/Notice";
import PlayerFields from "./PlayerFields";
import { useLocale, useT } from "@/i18n/client";
import { fmt, plural } from "@/i18n/format";
import LocaleField from "@/i18n/LocaleField";
import {
  addPlayerAction,
  removePlayerAction,
  updatePlayerAction,
} from "@/lib/portal/actions";
import { IDLE } from "@/lib/portal/validation";
import type { Player } from "@/lib/portal/types";

function AddPlayerForm({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [state, action, pending] = useActionState(addPlayerAction, IDLE);

  // Po úspěšném přidání formulář zavřeme — seznam už hráče obsahuje.
  useEffect(() => {
    if (state.status === "ok") onDone();
  }, [state.status, onDone]);

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-5)]">
      <LocaleField />
      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      <PlayerFields idPrefix="add" errors={state.errors} values={state.values} />

      <div className="flex flex-wrap gap-[var(--sp-3)]">
        <button
          type="submit"
          className={`cl-btn cl-btn--primary${pending ? " cl-btn--loading" : ""}`}
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
        >
          <span className="cl-btn-label">{t.teamForms.addPlayer}</span>
        </button>
        <button type="button" className="cl-btn cl-btn--ghost" onClick={onDone}>
          <span>{t.common.cancel}</span>
        </button>
      </div>
    </form>
  );
}

function EditPlayerForm({ player, onDone }: { player: Player; onDone: () => void }) {
  const t = useT();
  const [state, action, pending] = useActionState(updatePlayerAction, IDLE);

  useEffect(() => {
    if (state.status === "ok") onDone();
  }, [state.status, onDone]);

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-5)]">
      <LocaleField />
      <input type="hidden" name="playerId" value={player.id} />

      {state.status === "error" && state.message && (
        <Notice tone="error" live>
          {state.message}
        </Notice>
      )}

      <PlayerFields
        idPrefix={`edit-${player.id}`}
        player={player}
        errors={state.errors}
        values={state.values}
      />

      <div className="flex flex-wrap gap-[var(--sp-3)]">
        <button
          type="submit"
          className={`cl-btn cl-btn--primary cl-btn--sm${pending ? " cl-btn--loading" : ""}`}
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
        >
          <span className="cl-btn-label">{t.common.save}</span>
        </button>
        <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={onDone}>
          <span>{t.common.cancel}</span>
        </button>
      </div>
    </form>
  );
}

function PlayerRow({
  player,
  onEdit,
}: {
  player: Player;
  onEdit: () => void;
}) {
  const { teamForms: t, labels, common } = useT();
  // Mazání na dvě kliknutí, ať se soupiska nesmaže omylem.
  const [confirming, setConfirming] = useState(false);
  const name = `${player.firstName} ${player.lastName}`;

  const meta = [
    labels.positions[player.position],
    player.birthYear ? fmt(t.birthYearMeta, { year: player.birthYear }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="roster-row">
      <span className="roster-row__num cl-num" aria-hidden>
        {player.number ?? "–"}
      </span>

      <span className="flex flex-col gap-[2px]">
        <span className="roster-row__name">
          {name}
          {player.number === null && <span className="sr-only"> {t.noNumber}</span>}
        </span>
        <span className="roster-row__meta">{meta}</span>
      </span>

      {player.captain && <span className="cl-badge">{t.captainBadge}</span>}

      <span className="roster-row__actions">
        {confirming ? (
          <>
            <span className="roster-row__meta">{t.confirmDelete}</span>
            <form action={removePlayerAction}>
              <LocaleField />
              <input type="hidden" name="playerId" value={player.id} />
              <button
                type="submit"
                className="cl-btn cl-btn--primary cl-btn--sm"
                aria-label={fmt(t.confirmDeleteAria, { name })}
              >
                <span>{common.yes}</span>
              </button>
            </form>
            <button
              type="button"
              className="cl-iconbtn cl-iconbtn--bare"
              onClick={() => setConfirming(false)}
              aria-label={t.cancelDeleteAria}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="cl-iconbtn cl-iconbtn--bare"
              onClick={onEdit}
              aria-label={fmt(t.editAria, { name })}
            >
              <Pencil size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="cl-iconbtn cl-iconbtn--bare"
              onClick={() => setConfirming(true)}
              aria-label={fmt(t.deleteAria, { name })}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </>
        )}
      </span>
    </li>
  );
}

export default function RosterManager({
  players,
  minRoster,
  maxRoster,
}: {
  players: Player[];
  /** Nejmenší soupiska podle turnaje, na který je tým přihlášený. */
  minRoster: number;
  /** Největší soupiska — víc hráčů přidat nejde (hlídá i databáze). */
  maxRoster: number;
}) {
  const locale = useLocale();
  const { teamForms: t, counts } = useT();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const full = players.length >= maxRoster;

  const sorted = [...players].sort(
    (a, b) => (a.number ?? 999) - (b.number ?? 999) || a.lastName.localeCompare(b.lastName, "cs")
  );

  return (
    <div className="flex flex-col gap-[var(--sp-6)]">
      <div className="flex flex-wrap items-center justify-between gap-[var(--sp-3)]">
        <span className="cl-stat__label">
          {fmt(t.onRoster, { count: plural(locale, players.length, counts.players) })}
        </span>
        {!adding && !full && (
          <button
            type="button"
            className="cl-btn cl-btn--secondary cl-btn--sm"
            onClick={() => {
              setAdding(true);
              setEditingId(null);
            }}
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            <span>{t.addPlayer}</span>
          </button>
        )}
      </div>

      {full && (
        <Notice tone="info">{fmt(t.rosterFull, { max: plural(locale, maxRoster, counts.players) })}</Notice>
      )}

      {adding && !full && (
        <div className="cl-card cl-card--flat">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <AddPlayerForm onDone={() => setAdding(false)} />
            </div>
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <Notice tone="accent">
          {fmt(t.emptyRoster, { min: plural(locale, minRoster, counts.playersAcc) })}
        </Notice>
      ) : (
        <ul aria-label={t.rosterLabel}>
          {sorted.map((player) =>
            editingId === player.id ? (
              <li key={player.id} className="roster-row" style={{ display: "block" }}>
                <div className="cl-card cl-card--flat">
                  <div className="cl-card__in">
                    <div className="cl-card__body">
                      <EditPlayerForm player={player} onDone={() => setEditingId(null)} />
                    </div>
                  </div>
                </div>
              </li>
            ) : (
              <PlayerRow
                key={player.id}
                player={player}
                onEdit={() => {
                  setEditingId(player.id);
                  setAdding(false);
                }}
              />
            )
          )}
        </ul>
      )}
    </div>
  );
}
