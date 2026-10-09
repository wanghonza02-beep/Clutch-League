"use client";

import { useActionState, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import Field, { SelectField } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import { EVENT_KINDS, EVENT_LABEL, matchPoints, type EventInput } from "@/lib/admin/result";
import { saveMatchResultAction } from "@/lib/admin/resultActions";
import type { MatchEventKind } from "@/lib/supabase/database.types";
import { IDLE, type FormState } from "@/lib/portal/validation";

type Row = EventInput & { key: number };

type TeamSide = { id: string; name: string; roster: string[] };

/** Jména ze soupisky jako nabídka pro pole Jméno a Příjmení. */
function RosterSuggestions({ id, roster, part }: { id: string; roster: string[]; part: 0 | 1 }) {
  const values = [
    ...new Set(
      roster.map((full) => {
        const [first, ...rest] = full.split(" ");
        return part === 0 ? first : rest.join(" ");
      })
    ),
  ].filter(Boolean);
  return (
    <datalist id={id}>
      {values.map((v) => (
        <option key={v} value={v} />
      ))}
    </datalist>
  );
}

export default function MatchResultForm({
  matchId,
  home,
  away,
  initialHome,
  initialAway,
  initialEvents,
  limit,
}: {
  matchId: string;
  home: TeamSide;
  away: TeamSide;
  initialHome: number | null;
  initialAway: number | null;
  initialEvents: { kind: MatchEventKind; teamId: string; firstName: string; lastName: string; minute: number }[];
  /** Nejvyšší povolená minuta. */
  limit: number;
}) {
  const [homeGoals, setHomeGoals] = useState(initialHome?.toString() ?? "");
  const [awayGoals, setAwayGoals] = useState(initialAway?.toString() ?? "");
  const [rows, setRows] = useState<Row[]>(() =>
    initialEvents.map((e, i) => ({
      key: i + 1,
      kind: e.kind,
      side: e.teamId === home.id ? "home" : "away",
      firstName: e.firstName,
      lastName: e.lastName,
      minute: String(e.minute),
    }))
  );
  const [confirmClear, setConfirmClear] = useState(false);

  // Uložení i smazání jde přes jednu akci (smazání posílá intent=clear),
  // takže nad tlačítky je vždy jen jedna, poslední hláška.
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await saveMatchResultAction(prev, formData);
    if (formData.get("intent") === "clear") {
      setConfirmClear(false);
      if (result.status === "ok") {
        setHomeGoals("");
        setAwayGoals("");
        setRows([]);
      }
    }
    return result;
  }, IDLE);

  const errors = state.errors ?? {};
  const update = (key: number, patch: Partial<EventInput>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRow = (kind: MatchEventKind) =>
    setRows((rs) => [
      ...rs,
      {
        key: rs.reduce((max, r) => Math.max(max, r.key), 0) + 1,
        kind,
        side: "home",
        firstName: "",
        lastName: "",
        minute: "",
      },
    ]);

  // Živě: body ze skóre a kontrola, jestli rozepsané góly sedí se skóre.
  const h = Number(homeGoals);
  const a = Number(awayGoals);
  const scoreReady =
    homeGoals.trim() !== "" && awayGoals.trim() !== "" && Number.isInteger(h) && Number.isInteger(a) && h >= 0 && a >= 0;
  const points = scoreReady ? matchPoints(h, a) : null;
  const goalRows = rows.filter((r) => r.kind === "goal");
  const goalsHome = goalRows.filter((r) => r.side === "home").length;
  const goalsAway = goalRows.filter((r) => r.side === "away").length;
  const goalsMismatch = scoreReady && goalRows.length > 0 && (goalsHome !== h || goalsAway !== a);

  return (
    <div className="flex flex-col gap-[var(--sp-8)]">
      <form action={action} noValidate className="flex flex-col gap-[var(--sp-8)]">
        <input type="hidden" name="matchId" value={matchId} />
        <input
          type="hidden"
          name="events"
          value={JSON.stringify(rows.map(({ kind, side, firstName, lastName, minute }) => ({ kind, side, firstName, lastName, minute })))}
        />

        {/* ---- skóre a body ---- */}
        <section className="flex flex-col gap-[var(--sp-4)]" aria-labelledby="res-score">
          <h2 id="res-score" className="adm-sub">
            Konečné skóre
          </h2>
          <div className="res-score">
            <Field id="res-home" label={home.name} error={errors.homeGoals}>
              <input
                id="res-home"
                name="homeGoals"
                inputMode="numeric"
                value={homeGoals}
                onChange={(e) => setHomeGoals(e.target.value)}
                aria-invalid={errors.homeGoals ? true : undefined}
                aria-describedby="res-home-msg"
                className="cl-field__input"
              />
            </Field>
            <span className="res-score__sep" aria-hidden>
              :
            </span>
            <Field id="res-away" label={away.name} error={errors.awayGoals}>
              <input
                id="res-away"
                name="awayGoals"
                inputMode="numeric"
                value={awayGoals}
                onChange={(e) => setAwayGoals(e.target.value)}
                aria-invalid={errors.awayGoals ? true : undefined}
                aria-describedby="res-away-msg"
                className="cl-field__input"
              />
            </Field>
          </div>

          <dl className="hist-timeline__stats">
            <div className="cl-stat">
              <dt className="cl-stat__label">Body {home.name}</dt>
              <dd className="cl-stat__val order-first">{points ? points[0] : "–"}</dd>
            </div>
            <div className="cl-stat">
              <dt className="cl-stat__label">Body {away.name}</dt>
              <dd className="cl-stat__val order-first">{points ? points[1] : "–"}</dd>
            </div>
            <div className={`cl-stat${goalsMismatch ? " cl-stat--accent" : ""}`}>
              <dt className="cl-stat__label">Rozepsané góly</dt>
              <dd className="cl-stat__val order-first">
                {goalRows.length ? `${goalsHome}:${goalsAway}` : "–"}
              </dd>
            </div>
          </dl>
          <p className="cl-field__hint" style={{ margin: 0 }}>
            Body se počítají samy: výhra 3, remíza 1, prohra 0.
          </p>
          {goalsMismatch && (
            <Notice tone="accent">
              Rozepsané góly dávají {goalsHome}:{goalsAway}, skóre je {h}:{a}. Před uložením je srovnej.
            </Notice>
          )}
        </section>

        {/* ---- góly a karty ---- */}
        <section className="flex flex-col gap-[var(--sp-4)]" aria-labelledby="res-events">
          <h2 id="res-events" className="adm-sub">
            Góly a karty
          </h2>
          <p className="cl-field__hint" style={{ margin: 0 }}>
            Gól zapiš týmu, kterému se počítá (i vlastní gól). Když góly rozepíšeš, musí sedět se
            skóre. Když střelce neznáš, nech jen skóre. Minuta 1 až {limit}.
          </p>

          <RosterSuggestions id="roster-home-first" roster={home.roster} part={0} />
          <RosterSuggestions id="roster-home-last" roster={home.roster} part={1} />
          <RosterSuggestions id="roster-away-first" roster={away.roster} part={0} />
          <RosterSuggestions id="roster-away-last" roster={away.roster} part={1} />

          {rows.length === 0 ? (
            <Notice tone="info">Zatím žádný gól ani karta.</Notice>
          ) : (
            <ol className="flex flex-col gap-[var(--sp-3)]" aria-label="Góly a karty">
              {rows.map((row, i) => {
                const err = (f: string) => errors[`event.${i}.${f}`];
                const id = (f: string) => `ev-${row.key}-${f}`;
                return (
                  <li key={row.key} className={`res-event res-event--${row.kind}`}>
                    <SelectField
                      id={id("kind")}
                      label="Typ"
                      value={row.kind}
                      onChange={(e) => update(row.key, { kind: e.target.value })}
                      error={err("kind")}
                    >
                      {EVENT_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {EVENT_LABEL[k]}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      id={id("side")}
                      label="Tým"
                      value={row.side}
                      onChange={(e) => update(row.key, { side: e.target.value })}
                      error={err("side")}
                    >
                      <option value="home">{home.name}</option>
                      <option value="away">{away.name}</option>
                    </SelectField>
                    <Field id={id("first")} label="Jméno" error={err("firstName")}>
                      <input
                        id={id("first")}
                        value={row.firstName}
                        list={`roster-${row.side}-first`}
                        autoComplete="off"
                        onChange={(e) => update(row.key, { firstName: e.target.value })}
                        aria-invalid={err("firstName") ? true : undefined}
                        aria-describedby={`${id("first")}-msg`}
                        className="cl-field__input"
                      />
                    </Field>
                    <Field id={id("last")} label="Příjmení" error={err("lastName")}>
                      <input
                        id={id("last")}
                        value={row.lastName}
                        list={`roster-${row.side}-last`}
                        autoComplete="off"
                        onChange={(e) => update(row.key, { lastName: e.target.value })}
                        aria-invalid={err("lastName") ? true : undefined}
                        aria-describedby={`${id("last")}-msg`}
                        className="cl-field__input"
                      />
                    </Field>
                    <Field id={id("min")} label="Minuta" error={err("minute")}>
                      <input
                        id={id("min")}
                        inputMode="numeric"
                        value={row.minute}
                        onChange={(e) => update(row.key, { minute: e.target.value })}
                        aria-invalid={err("minute") ? true : undefined}
                        aria-describedby={`${id("min")}-msg`}
                        className="cl-field__input"
                      />
                    </Field>
                    <button
                      type="button"
                      className="cl-iconbtn cl-iconbtn--bare res-event__remove"
                      onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                      aria-label={`Odebrat řádek ${i + 1}`}
                    >
                      <X size={18} strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="adm-actions">
            <button type="button" className="cl-btn cl-btn--secondary cl-btn--sm" onClick={() => addRow("goal")}>
              <Plus size={14} strokeWidth={2} aria-hidden />
              <span>Gól</span>
            </button>
            <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={() => addRow("yellow_card")}>
              <Plus size={14} strokeWidth={2} aria-hidden />
              <span>Žlutá karta</span>
            </button>
            <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={() => addRow("red_card")}>
              <Plus size={14} strokeWidth={2} aria-hidden />
              <span>Červená karta</span>
            </button>
          </div>
        </section>

        {state.status !== "idle" && state.message && (
          <Notice tone={state.status === "ok" ? "ok" : "error"} live>
            {state.message}
          </Notice>
        )}

        <div className="adm-actions">
          <button
            type="submit"
            className={`cl-btn cl-btn--primary cl-btn--lg w-full sm:w-auto${pending ? " cl-btn--loading" : ""}`}
            aria-disabled={pending || undefined}
            aria-busy={pending || undefined}
          >
            <Save size={18} strokeWidth={2} aria-hidden />
            <span className="cl-btn-label">Uložit výsledek</span>
          </button>

          {/* Smazání výsledku — dvoukrokové, ať se nesmaže omylem. */}
          {initialHome !== null &&
            (confirmClear ? (
              <span className="res-clear" role="group" aria-label="Potvrzení smazání">
                <span className="roster-row__meta">Smazat skóre i všechny góly a karty?</span>
                <button type="submit" name="intent" value="clear" className="cl-btn cl-btn--secondary cl-btn--sm">
                  <span>Ano, smazat</span>
                </button>
                <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={() => setConfirmClear(false)}>
                  <span>Zrušit</span>
                </button>
              </span>
            ) : (
              <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm" onClick={() => setConfirmClear(true)}>
                <Trash2 size={14} strokeWidth={2} aria-hidden />
                <span>Smazat výsledek</span>
              </button>
            ))}
        </div>
      </form>
    </div>
  );
}
