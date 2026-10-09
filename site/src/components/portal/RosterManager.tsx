"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import Notice from "@/components/ui/Notice";
import PlayerFields from "./PlayerFields";
import {
  addPlayerAction,
  removePlayerAction,
  updatePlayerAction,
} from "@/lib/portal/actions";
import { PLAYERS_ACC, PLAYERS_NOM, plural } from "@/lib/plural";
import { IDLE } from "@/lib/portal/validation";
import { POSITION_LABEL, type Player } from "@/lib/portal/types";

function AddPlayerForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState(addPlayerAction, IDLE);

  // Po úspěšném přidání formulář zavřeme — seznam už hráče obsahuje.
  useEffect(() => {
    if (state.status === "ok") onDone();
  }, [state.status, onDone]);

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-5)]">
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
          <span className="cl-btn-label">Přidat hráče</span>
        </button>
        <button type="button" className="cl-btn cl-btn--ghost" onClick={onDone}>
          <span>Zrušit</span>
        </button>
      </div>
    </form>
  );
}

function EditPlayerForm({ player, onDone }: { player: Player; onDone: () => void }) {
  const [state, action, pending] = useActionState(updatePlayerAction, IDLE);

  useEffect(() => {
    if (state.status === "ok") onDone();
  }, [state.status, onDone]);

  return (
    <form action={action} noValidate className="flex flex-col gap-[var(--sp-5)]">
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
          <span className="cl-btn-label">Uložit</span>
        </button>
        <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={onDone}>
          <span>Zrušit</span>
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
  // Mazání na dvě kliknutí, ať se soupiska nesmaže omylem.
  const [confirming, setConfirming] = useState(false);

  const meta = [POSITION_LABEL[player.position], player.birthYear ? `ročník ${player.birthYear}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="roster-row">
      <span className="roster-row__num cl-num" aria-hidden>
        {player.number ?? "–"}
      </span>

      <span className="flex flex-col gap-[2px]">
        <span className="roster-row__name">
          {player.firstName} {player.lastName}
          {player.number === null && (
            <span className="sr-only"> (bez čísla dresu)</span>
          )}
        </span>
        <span className="roster-row__meta">{meta}</span>
      </span>

      {player.captain && <span className="cl-badge">Kapitán</span>}

      <span className="roster-row__actions">
        {confirming ? (
          <>
            <span className="roster-row__meta">Smazat?</span>
            <form action={removePlayerAction}>
              <input type="hidden" name="playerId" value={player.id} />
              <button
                type="submit"
                className="cl-btn cl-btn--primary cl-btn--sm"
                aria-label={`Potvrdit smazání hráče ${player.firstName} ${player.lastName}`}
              >
                <span>Ano</span>
              </button>
            </form>
            <button
              type="button"
              className="cl-iconbtn cl-iconbtn--bare"
              onClick={() => setConfirming(false)}
              aria-label="Zrušit mazání"
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
              aria-label={`Upravit hráče ${player.firstName} ${player.lastName}`}
            >
              <Pencil size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="cl-iconbtn cl-iconbtn--bare"
              onClick={() => setConfirming(true)}
              aria-label={`Smazat hráče ${player.firstName} ${player.lastName}`}
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
}: {
  players: Player[];
  /** Nejmenší soupiska podle turnaje, na který je tým přihlášený. */
  minRoster: number;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...players].sort(
    (a, b) => (a.number ?? 999) - (b.number ?? 999) || a.lastName.localeCompare(b.lastName, "cs")
  );

  return (
    <div className="flex flex-col gap-[var(--sp-6)]">
      <div className="flex flex-wrap items-center justify-between gap-[var(--sp-3)]">
        <span className="cl-stat__label">
          Na soupisce {players.length}{" "}
          {plural(players.length, PLAYERS_NOM)}
        </span>
        {!adding && (
          <button
            type="button"
            className="cl-btn cl-btn--secondary cl-btn--sm"
            onClick={() => {
              setAdding(true);
              setEditingId(null);
            }}
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            <span>Přidat hráče</span>
          </button>
        )}
      </div>

      {adding && (
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
          Soupiska je zatím prázdná. Na turnaj potřebuješ aspoň {minRoster}{" "}
          {plural(minRoster, PLAYERS_ACC)}. Pokud hraješ i ty, přidej i sebe.
        </Notice>
      ) : (
        <ul aria-label="Soupiska hráčů">
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
