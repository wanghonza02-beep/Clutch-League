import type { Metadata } from "next";
import { CalendarDays, ExternalLink } from "lucide-react";
import EntryDecision from "@/components/admin/EntryDecision";
import PortalHeader from "@/components/portal/PortalHeader";
import Notice from "@/components/ui/Notice";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { listEntryGroups, type AdminEntry, type AdminTournamentInfo } from "@/lib/admin/data";
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

  return (
    <li className="entry" id={`tym-${entry.teamId}`}>
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
      </dl>

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

      <EntryDecision
        tournamentId={entry.tournamentId}
        teamId={entry.teamId}
        teamName={entry.teamName}
        status={entry.status}
        matches={entry.matches}
        playedMatches={entry.playedMatches}
        rosterIssue={issue}
      />
    </li>
  );
}

/**
 * Přihlášky na nadcházející turnaje. Každý turnaj má vlastní oddíl (název,
 * datum, stav přihlášek, počty), týmy v něm jsou karty se vším, co je
 * potřeba k rozhodnutí. Kapitán každé rozhodnutí uvidí ve svém portálu.
 */
export default async function PortalPrihlasky({ searchParams }: PageProps<"/[lang]/portal/prihlasky">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const groups = await listEntryGroups();

  const raw = (await searchParams).stav;
  const filter = FILTERS.find((f) => f.key === raw) ?? FILTERS[0];
  const total = groups.reduce(
    (acc, g) => ({
      all: acc.all + g.entries.length,
      pending: acc.pending + g.counts.pending,
      approved: acc.approved + g.counts.approved,
      rejected: acc.rejected + g.counts.rejected,
    }),
    { all: 0, pending: 0, approved: 0, rejected: 0 }
  );
  const countFor = (status: EntryStatus | null) => (status ? total[status] : total.all);

  return (
    <>
      <PortalHeader
        over={t.over}
        title={t.entriesTitle}
        sub={`${total.pending > 0 ? plural(locale, total.pending, t.entriesPending) : t.entriesDone} ${t.entriesSub}`}
      />

      {groups.length === 0 ? (
        <Notice tone="info">{t.entriesNoTournament}</Notice>
      ) : (
        <>
          {total.all > 0 && (
            <nav className="chips" aria-label={t.filterLabel}>
              {FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={f.status ? `/portal/prihlasky?stav=${f.key}` : "/portal/prihlasky"}
                  className={`chip${f === filter ? " is-active" : ""}`}
                  aria-current={f === filter ? "page" : undefined}
                  scroll={false}
                >
                  {t.filters[f.key as keyof typeof t.filters]}
                  <span className="chip__count cl-num">{countFor(f.status)}</span>
                </Link>
              ))}
            </nav>
          )}

          {groups.map(({ tournament, counts, entries }) => {
            const shown = filter.status ? entries.filter((e) => e.status === filter.status) : entries;
            return (
              <section key={tournament.id} aria-labelledby={`turnaj-${tournament.id}`} className="entry-group">
                <header className="entry-group__head">
                  <div className="flex flex-wrap items-center gap-[var(--sp-2)_var(--sp-4)]">
                    <h2 id={`turnaj-${tournament.id}`} className="portal-h2">
                      {tournament.name}
                    </h2>
                    <span className={tournament.registrationOpen ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                      {tournament.registrationOpen ? t.registrationOpen : t.registrationClosedBadge}
                    </span>
                  </div>
                  <p className="adm-meta">
                    <span className="cl-num">{formatDate(tournament.startsOn, locale)}</span>
                    {tournament.format && <span>{tournament.format}</span>}
                    <span>{fmt(t.rosterLimits, { min: tournament.minRoster, max: tournament.maxRoster })}</span>
                    <Link href={`/portal/turnaje/${tournament.id}`}>
                      {t.tournamentDetail} <ExternalLink size={12} strokeWidth={2} aria-hidden style={{ display: "inline" }} />
                    </Link>
                  </p>
                  <p className="entry-group__counts">
                    {fmt(t.groupCounts, {
                      approved: counts.approved,
                      pending: counts.pending,
                      rejected: counts.rejected,
                    })}
                  </p>
                </header>

                {entries.length === 0 ? (
                  <Notice tone="info">
                    {tournament.registrationOpen ? t.groupEmptyOpen : t.groupEmptyClosed}
                  </Notice>
                ) : shown.length === 0 ? (
                  <Notice tone="info">{t.groupEmptyFilter}</Notice>
                ) : (
                  <div className="cl-card">
                    <div className="cl-card__in">
                      <ul className="cl-card__body entry-list" aria-label={fmt(t.groupLabel, { name: tournament.name })}>
                        {shown.map((entry) => (
                          <EntryCard key={entry.teamId} entry={entry} tournament={tournament} dict={dict} locale={locale} />
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}
    </>
  );
}
