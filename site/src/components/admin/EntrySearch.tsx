"use client";

import { createContext, useContext, useDeferredValue, useState, type ComponentProps, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import Notice from "@/components/ui/Notice";
import Link from "@/i18n/Link";
import { matchesSearch } from "@/lib/search";

/**
 * Hledání v přihláškách turnaje (/portal/prihlasky/[turnaj]). Karty přihlášek
 * vykresluje server, tady se jen schovají ty, které nesedí na hledaný výraz.
 * Výraz se propisuje do adresy (?q=), takže přežije přepnutí filtru stavu
 * i obnovení stránky. Pravidla hledání jsou v lib/search.
 */

/** Podle čeho se dá přihláška najít. */
export type EntrySearchData = { text: string; phones: string[] };

/** Výraz, podle kterého se filtruje (odložený, ať psaní nezadrhává). */
const QueryContext = createContext("");
/** Okamžitá hodnota pole. */
const InputValueContext = createContext("");
const SetQueryContext = createContext<(query: string) => void>(() => {});

export function EntrySearchProvider({ initialQuery, children }: { initialQuery: string; children: ReactNode }) {
  const [query, setQuery] = useState(initialQuery);
  const deferred = useDeferredValue(query);

  const update = (next: string) => {
    setQuery(next);
    const url = new URL(window.location.href);
    if (next.trim()) url.searchParams.set("q", next.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <SetQueryContext.Provider value={update}>
      <QueryContext.Provider value={deferred}>
        <InputValueContext.Provider value={query}>{children}</InputValueContext.Provider>
      </QueryContext.Provider>
    </SetQueryContext.Provider>
  );
}

export function EntrySearchField({ label, placeholder, clear }: { label: string; placeholder: string; clear: string }) {
  const value = useContext(InputValueContext);
  const update = useContext(SetQueryContext);

  return (
    <div className="search-field entries-bar__search">
      <Search size={18} strokeWidth={2} aria-hidden className="search-field__icon" />
      <label htmlFor="entries-q" className="sr-only">
        {label}
      </label>
      <input
        id="entries-q"
        type="search"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        title={label}
        autoComplete="off"
        spellCheck={false}
        className="cl-field__input search-field__input"
      />
      {value && (
        <button type="button" className="search-field__clear" onClick={() => update("")} aria-label={clear}>
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  );
}

/**
 * Odkaz filtru stavu, který si s sebou nese hledaný výraz. Přepnutí filtru
 * nezakládá nový záznam v historii, takže „Zpět“ vede na seznam turnajů.
 */
export function EntryFilterLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const query = useContext(InputValueContext).trim();
  const withQuery = query ? `${href}${href.includes("?") ? "&" : "?"}q=${encodeURIComponent(query)}` : href;
  return <Link href={withQuery} replace {...props} />;
}

/** Přihláška v seznamu — bez shody se neukáže. */
export function EntrySearchItem({ data, children }: { data: EntrySearchData; children: ReactNode }) {
  const query = useContext(QueryContext);
  return matchesSearch(query, data.text, data.phones) ? children : null;
}

/** Seznam přihlášek turnaje — když nesedí žádná, ukáže místo něj hlášku. */
export function EntrySearchGroup({
  items,
  empty,
  children,
}: {
  items: EntrySearchData[];
  empty: string;
  children: ReactNode;
}) {
  const query = useContext(QueryContext);
  if (items.some((item) => matchesSearch(query, item.text, item.phones))) return children;
  return <Notice tone="info">{empty}</Notice>;
}
