"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { formatDate, formatPhone } from "@/lib/format";
import { matchesSearch } from "@/lib/search";
import type { EntryStatus, Role } from "@/lib/portal/types";

export type BrowserUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
  team: { name: string; code: string; players: number; entryStatus: EntryStatus | null } | null;
};

type Filter = "vse" | "kapitani" | "organizatori" | "bez-tymu";
const FILTERS: Filter[] = ["vse", "kapitani", "organizatori", "bez-tymu"];

function matches(u: BrowserUser, query: string): boolean {
  const code = u.team?.code ?? "";
  return matchesSearch(query, [u.name, u.email, u.team?.name ?? "", code, code.replace("-", "")].join(" "), [u.phone]);
}

function byFilter(u: BrowserUser, filter: Filter): boolean {
  if (filter === "kapitani") return u.role === "captain";
  if (filter === "organizatori") return u.role === "admin";
  if (filter === "bez-tymu") return u.role === "captain" && !u.team;
  return true;
}

/** Hledání a filtr se propisují do adresy — odkaz na výsledek jde poslat dál. */
function syncUrl(query: string, filter: Filter) {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  if (filter !== "vse") url.searchParams.set("filtr", filter);
  else url.searchParams.delete("filtr");
  window.history.replaceState(window.history.state, "", url);
}

const STATUS_BADGE: Record<EntryStatus, string> = {
  pending: "cl-badge cl-badge--neutral",
  approved: "cl-badge",
  rejected: "cl-badge cl-badge--danger",
};

export default function UsersBrowser({
  users,
  meId,
  tournamentName,
  initialQuery,
  initialFilter,
}: {
  users: BrowserUser[];
  meId: string;
  /** Hlavní turnaj — u týmů se ukazuje stav přihlášky na něj. */
  tournamentName: string | null;
  initialQuery: string;
  initialFilter: string;
}) {
  const { usersBrowser: t, labels } = useT();
  const locale = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>(
    FILTERS.includes(initialFilter as Filter) ? (initialFilter as Filter) : "vse"
  );
  const deferred = useDeferredValue(query);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f, users.filter((u) => byFilter(u, f)).length])) as Record<Filter, number>,
    [users]
  );
  const shown = useMemo(
    () => users.filter((u) => byFilter(u, filter) && matches(u, deferred)),
    [users, filter, deferred]
  );

  const update = (nextQuery: string, nextFilter: Filter) => {
    setQuery(nextQuery);
    setFilter(nextFilter);
    syncUrl(nextQuery.trim(), nextFilter);
  };

  return (
    <div className="users">
      <div className="users__bar">
        <div className="search-field">
          <Search size={18} strokeWidth={2} aria-hidden className="search-field__icon" />
          <label htmlFor="users-q" className="sr-only">
            {t.searchLabel}
          </label>
          <input
            id="users-q"
            type="search"
            value={query}
            onChange={(e) => update(e.target.value, filter)}
            placeholder={t.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            className="cl-field__input search-field__input"
          />
          {query && (
            <button type="button" className="search-field__clear" onClick={() => update("", filter)} aria-label={t.clear}>
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>

        <div className="chips" role="group" aria-label={t.filterLabel}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip${f === filter ? " is-active" : ""}`}
              aria-pressed={f === filter}
              onClick={() => update(query, f)}
            >
              {t.filters[f]}
              <span className="chip__count cl-num">{counts[f]}</span>
            </button>
          ))}
        </div>

        <p className="adm-meta" aria-live="polite" style={{ margin: 0 }}>
          {fmt(t.shown, { shown: shown.length, total: users.length })}
        </p>
      </div>

      {shown.length === 0 ? (
        <div className="users__empty">
          <p>{t.empty}</p>
          <button type="button" className="cl-btn cl-btn--ghost cl-btn--sm cl-btn--flush" onClick={() => update("", "vse")}>
            <span>{t.reset}</span>
          </button>
        </div>
      ) : (
        <div className="cl-card">
          <div className="cl-card__in">
            <ul className="cl-card__body" aria-label={t.listLabel}>
              {shown.map((u) => (
                <li key={u.id} className="adm-item users__row">
                  <div className="adm-item__head">
                    <span className="adm-item__title">{u.name || u.email}</span>
                    <span className={u.role === "captain" ? "cl-badge cl-badge--neutral" : "cl-badge"}>
                      {labels.roles[u.role]}
                    </span>
                    {u.id === meId && <span className="adm-meta">{t.itsYou}</span>}
                  </div>
                  <div className="adm-meta">
                    <a href={`mailto:${u.email}`}>{u.email}</a>
                    {u.phone && <a href={`tel:${u.phone}`}>{formatPhone(u.phone)}</a>}
                    <span>{fmt(t.registered, { date: formatDate(u.createdAt.slice(0, 10), locale) })}</span>
                  </div>
                  {/* Tým má i organizátor, který za něj hraje. */}
                  {(u.team || u.role === "captain") && (
                    <div className="adm-meta users__team">
                      {u.team ? (
                        <>
                          <span className="users__team-name">{u.team.name}</span>
                          <span className="cl-num">{u.team.code}</span>
                          <span>{fmt(t.players, { n: u.team.players })}</span>
                          {tournamentName &&
                            (u.team.entryStatus ? (
                              <span className={STATUS_BADGE[u.team.entryStatus]}>
                                {tournamentName}: {labels.entryStatus[u.team.entryStatus]}
                              </span>
                            ) : (
                              <span>{fmt(t.notEntered, { tournament: tournamentName })}</span>
                            ))}
                        </>
                      ) : (
                        <span className="users__noteam">{t.noTeam}</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
