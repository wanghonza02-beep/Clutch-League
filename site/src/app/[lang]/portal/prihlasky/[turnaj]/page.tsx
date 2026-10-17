import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import BackButton from "@/components/BackButton";
import EntryDecision from "@/components/admin/EntryDecision";
import EntryPayment from "@/components/admin/EntryPayment";
import {
  EntryFilterLink,
  EntrySearchField,
  EntrySearchGroup,
  EntrySearchItem,
  EntrySearchProvider,
  type EntrySearchData,
} from "@/components/admin/EntrySearch";
import TournamentBadges from "@/components/admin/TournamentBadges";
import PortalHeader from "@/components/portal/PortalHeader";
import Notice from "@/components/ui/Notice";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fmt, formatMoney, plural } from "@/i18n/format";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { getEntryGroup, type AdminEntry, type AdminTournamentInfo } from "@/lib/admin/data";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";
import type { EntryStatus } from "@/lib/portal/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.entriesMetaTitle) };
}

/** Filtr v adrese (?stav=…) — česky, ať je odkaz čitelný. */
const FILTERS: { key: string; status: EntryStatus | null }[] = [
  { key: "vse", status: null },
  { key: "cekajici", status: "pending" },
  { key: "schvalene", status: "approved" },
  { key: "zamitnute", status: "rejected" },
];

const BADGE: Record<EntryStatus, string> = {
  pending: "cl-badge cl-badge--neutral",
  approved: "cl-badge",
  rejected: "cl-badge cl-badge--danger",
};

/** Podle čeho se dá přihláška najít: tým, kód, město, barvy, poznámka, kapitán, hráči. */
function searchData(entry: AdminEntry): EntrySearchData {
  return {
    text: [
      entry.teamName,
      entry.code,
      entry.code.replace("-", ""),
      entry.city,
      entry.colors,
      entry.note,
      entry.captain?.name ?? "",
      entry.captain?.email ?? "",
      ...entry.players.map((p) => p.name),
    ].join(" "),
    phones: entry.captain?.phone ? [entry.captain.phone] : [],
  };
}

/** Proč soupiska nesedí s limity turnaje (prázdné = sedí). */
function rosterIssue(count: number, tournament: AdminTournamentInfo, dict: Dictionary, locale: Locale): string {
  const t = dict.admin;
  if (count < tournament.minRoster) {
    return fmt(t.rosterTooSmall, {
      count: plural(locale, count, dict.counts.players),
      min: plural(locale, tournament.minRoster, dict.counts.playersAcc),
    });
  }
  if (count > tournament.maxRoster) {
    return fmt(t.rosterTooBig, {
      count: plural(locale, count, dict.counts.players),
      max: plural(locale, tournament.maxRoster, dict.counts.playersAcc),
    });
  }
  return "";
}

function EntryCard({
  entry,
  tournament,
  dict,
  locale,
}: {
  entry: AdminEntry;
  tournament: AdminTournamentInfo;
  dict: Dictionary;
  locale: Locale;
}) {
  const t = dict.admin;
  const issue = rosterIssue(entry.players.length, tournament, dict, locale);
  // Startovné, které tým při odeslání viděl; u starších přihlášek startovné turnaje.
  const fee = entry.confirmedFee ?? tournament.entryFee;
  const amount = formatMoney(locale, fee, dict.common.money);
  const paymentMissing = fee > 0 && !entry.paid;

  return (
    <li className="cl-card entry-card" id={`tym-${entry.teamId}`}>
      <div className="cl-card__in">
        <div className="cl-card__body entry">
          <div className="entry__head">
            <h3 className="adm-item__title">{entry.teamName}</h3>
            <span className={BADGE[entry.status]}>{dict.labels.entryStatus[entry.status]}</span>
            <span className="adm-meta">
              {fmt(t.submittedAt, { date: formatDateTime(entry.createdAt, locale) })}
            </span>
          </div>

          <dl className="entry__facts">
            <div>
              <dt className="cl-stat__label">{t.factCaptain}</dt>
              <dd>
                {entry.captain ? (
                  <>
                    <span className="entry__strong">{entry.captain.name}</span>
                    <span className="entry__contacts">
                      <a href={`mailto:${entry.captain.email}`}>{entry.captain.email}</a>
                      {entry.captain.phone && <a href={`tel:${entry.captain.phone}`}>{formatPhone(entry.captain.phone)}</a>}
                    </span>
                  </>
                ) : (
                  t.noCaptain
                )}
              </dd>
            </div>
            <div>
              <dt className="cl-stat__label">{t.factRoster}</dt>
              <dd className={issue ? "entry__warn" : undefined}>
                <span className="entry__strong">{plural(locale, entry.players.length, dict.counts.players)}</span>
                <span className="entry__sub">
                  {fmt(t.rosterLimits, { min: tournament.minRoster, max: tournament.maxRoster })}
                </span>
              </dd>
            </div>
            <div>
              <dt className="cl-stat__label">{t.factCode}</dt>
              <dd className="entry__strong cl-num">{entry.code}</dd>
            </div>
            {(entry.city || entry.colors) && (
              <div>
                <dt className="cl-stat__label">{t.factTeam}</dt>
                <dd>{[entry.city, entry.colors].filter(Boolean).join(" · ")}</dd>
              </div>
            )}
            {fee > 0 && (
              <div>
                <dt className="cl-stat__label">{t.factFee}</dt>
                <dd className={paymentMissing && entry.status !== "rejected" ? "entry__warn" : undefined}>
                  <span className="entry__strong">{amount}</span>
                  <span className="entry__sub">
                    {entry.paid
                      ? fmt(entry.paid.by ? t.feePaidBy : t.feePaidOn, {
                          date: formatDate(entry.paid.at.slice(0, 10), locale),
                          name: entry.paid.by ?? "",
                        })
                      : t.feeUnpaid}
                  </span>
                </dd>
              </div>
            )}
          </dl>

          {/* Co kapitán při odeslání potvrdil (dohledatelné i později). U archivu
              odehraných turnajů bez potvrzení se nic nepíše. */}
          {(entry.confirmedAt || tournament.status !== "completed") && (
            <p className="adm-meta">
              {entry.confirmedAt
                ? fmt(t.confirmedOn, {
                    date: formatDateTime(entry.confirmedAt, locale),
                    what: entry.confirmations
                      .map((key) =>
                        fmt(t.confirmationLabels[key], {
                          amount: formatMoney(locale, entry.confirmedFee ?? 0, dict.common.money),
                        })
                      )
                      .join(", "),
                  })
                : t.confirmedMissing}
            </p>
          )}

          {entry.note && <p className="entry__note">{fmt(t.note, { note: entry.note })}</p>}

          {entry.status === "rejected" && (
            <Notice tone="error">
              {entry.statusChangedAt
                ? fmt(t.rejectedOn, { date: formatDate(entry.statusChangedAt.slice(0, 10), locale) })
                : t.rejectedPlain}{" "}
              {entry.statusNote ? fmt(t.rejectedReason, { reason: entry.statusNote }) : t.rejectedNoReason}
            </Notice>
          )}
          {entry.status === "approved" && entry.statusChangedAt && (
            <p className="adm-meta">{fmt(t.approvedOn, { date: formatDate(entry.statusChangedAt.slice(0, 10), locale) })}</p>
          )}
          {entry.matches > 0 && (
            <p className="adm-meta">
              <CalendarDays size={14} strokeWidth={2} aria-hidden />
              {plural(locale, entry.matches, t.inSchedule)}
              {entry.playedMatches > 0 && ` · ${plural(locale, entry.playedMatches, t.withResult)}`}
            </p>
          )}

          {entry.players.length > 0 && (
            <details className="entry__roster">
              <summary>{fmt(t.showRoster, { count: plural(locale, entry.players.length, dict.counts.players) })}</summary>
              <ol>
                {entry.players.map((p, i) => (
                  <li key={`${p.name}-${i}`}>
                    <span className="cl-num entry__num">{p.number ?? "—"}</span>
                    <span>
                      {p.name}
                      {p.captain && <span className="cl-badge cl-badge--neutral entry__cap">{t.fieldCaptainShort}</span>}
                    </span>
                    <span className="entry__sub">
                      {dict.labels.positions[p.position]}
                      {p.birthYear ? ` · ${fmt(dict.teamForms.birthYearMeta, { year: p.birthYear })}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </details>
          )}

          {fee > 0 && entry.status !== "rejected" && (
            <EntryPayment
              tournamentId={entry.tournamentId}
              teamId={entry.teamId}
              status={entry.status}
              paid={Boolean(entry.paid)}
              amount={amount}
            />
          )}

          <EntryDecision
            tournamentId={entry.tournamentId}
            teamId={entry.teamId}
            teamName={entry.teamName}
            status={entry.status}
            matches={entry.matches}
            playedMatches={entry.playedMatches}
            rosterIssue={issue}
            paymentMissing={paymentMissing}
          />
        </div>
      </div>
    </li>
  );
}

/**
 * Přihlášky na jeden turnaj (karta v sekci Přihlášky): filtr podle stavu,
 * hledání a týmy jako karty se vším, co je potřeba k rozhodnutí. Kapitán
 * každé rozhodnutí uvidí ve svém portálu.
 */
export default async function PrihlaskyTurnaje({
  params,
  searchParams,
}: PageProps<"/[lang]/portal/prihlasky/[turnaj]">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const [{ turnaj }, query] = await Promise.all([params, searchParams]);
  const group = await getEntryGroup(turnaj);
  if (!group) notFound();

  const { tournament, counts, entries } = group;
  const base = `/portal/prihlasky/${tournament.id}`;
  const filter = FILTERS.find((f) => f.key === query.stav) ?? FILTERS[0];
  const search = typeof query.q === "string" ? query.q : "";
  const shown = filter.status ? entries.filter((e) => e.status === filter.status) : entries;
  const countFor = (status: EntryStatus | null) => (status ? counts[status] : entries.length);

  return (
    <>
      <div>
        <BackButton fallback="/portal/prihlasky" />
      </div>
      <PortalHeader over={dict.portalNav.entries} title={tournament.name} />

      <div className="entry-group__head">
        <p className="adm-meta">
          <TournamentBadges tournament={tournament} />
          <span className="cl-num">{formatDate(tournament.startsOn, locale)}</span>
          {tournament.format && <span>{tournament.format}</span>}
          <span>{fmt(t.rosterLimits, { min: tournament.minRoster, max: tournament.maxRoster })}</span>
        </p>
        <p className="entry-group__counts">
          {fmt(t.groupCounts, { approved: counts.approved, pending: counts.pending, rejected: counts.rejected })}
        </p>
      </div>

      {entries.length === 0 ? (
        <Notice tone="info">{tournament.registrationOpen ? t.groupEmptyOpen : t.groupEmptyClosed}</Notice>
      ) : (
        <EntrySearchProvider initialQuery={search}>
          <div className="entries-bar">
            <nav className="chips" aria-label={t.filterLabel}>
              {FILTERS.map((f) => (
                <EntryFilterLink
                  key={f.key}
                  href={f.status ? `${base}?stav=${f.key}` : base}
                  className={`chip${f === filter ? " is-active" : ""}`}
                  aria-current={f === filter ? "page" : undefined}
                  scroll={false}
                >
                  {t.filters[f.key as keyof typeof t.filters]}
                  <span className="chip__count cl-num">{countFor(f.status)}</span>
                </EntryFilterLink>
              ))}
            </nav>
            <EntrySearchField label={t.searchLabel} placeholder={t.searchPlaceholder} clear={t.searchClear} />
          </div>

          {shown.length === 0 ? (
            <Notice tone="info">{t.groupEmptyFilter}</Notice>
          ) : (
            <EntrySearchGroup items={shown.map(searchData)} empty={t.searchEmpty}>
              <ul className="entry-list" aria-label={fmt(t.groupLabel, { name: tournament.name })}>
                {shown.map((entry) => (
                  <EntrySearchItem key={entry.teamId} data={searchData(entry)}>
                    <EntryCard entry={entry} tournament={tournament} dict={dict} locale={locale} />
                  </EntrySearchItem>
                ))}
              </ul>
            </EntrySearchGroup>
          )}
        </EntrySearchProvider>
      )}
    </>
  );
}
