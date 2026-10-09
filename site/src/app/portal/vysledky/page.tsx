import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardPen, ExternalLink } from "lucide-react";
import EntryRankingForm from "@/components/admin/EntryRankingForm";
import { SelectField } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import { getResultsOverview, listTournaments, type ResultMatchRow } from "@/lib/admin/data";
import { matchPoints } from "@/lib/admin/result";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: "Zapsat výsledky | Portál Clutch League",
};

const h1Style = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-display)",
  fontStyle: "italic",
  fontSize: "var(--fs-h2)",
  lineHeight: "var(--lh-heading)",
  letterSpacing: "var(--ls-display)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
  margin: 0,
} as const;

const h2Style = { ...h1Style, fontSize: "var(--fs-h3)" } as const;

const plural = (n: number, one: string, few: string, many: string) =>
  `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`;

function MatchItem({ match }: { match: ResultMatchRow }) {
  const played = match.homeGoals !== null && match.awayGoals !== null;
  const points = played ? matchPoints(match.homeGoals!, match.awayGoals!) : null;
  return (
    <li className="adm-item" style={{ gap: "var(--sp-2)" }}>
      <div className="adm-item__head">
        <span className="adm-item__title">
          {match.homeTeam} <span aria-hidden>–</span>
          <span className="sr-only"> proti </span> {match.awayTeam}
        </span>
        <span className={played ? "cl-badge" : "cl-badge cl-badge--neutral"}>
          {played ? <span className="cl-num">{`${match.homeGoals}:${match.awayGoals}`}</span> : "Bez výsledku"}
        </span>
        <Link
          href={`/portal/vysledky/${match.id}`}
          className={`cl-btn cl-btn--sm ${played ? "cl-btn--ghost" : "cl-btn--secondary"}`}
          style={{ marginLeft: "auto" }}
        >
          <ClipboardPen size={14} strokeWidth={2} aria-hidden />
          <span>{played ? "Upravit" : "Zapsat výsledek"}</span>
        </Link>
      </div>
      <div className="adm-meta">
        <span className="cl-num">{formatDateTime(match.kickoff)}</span>
        {points && <span className="cl-num">Body {points[0]}:{points[1]}</span>}
        {played && (
          <span>
            {match.goals ? plural(match.goals, "gól se jménem", "góly se jménem", "gólů se jménem") : "bez střelců"}
            {match.cards > 0 && ` · ${plural(match.cards, "karta", "karty", "karet")}`}
          </span>
        )}
        {match.clutchMode && <span>Clutch Time: {match.clutchMode}</span>}
      </div>
    </li>
  );
}

export default async function PortalVysledky({ searchParams }: PageProps<"/portal/vysledky">) {
  await requireRole("admin");
  const { turnaj } = await searchParams;
  const tournaments = await listTournaments();

  // Bez výběru: nejbližší nadcházející turnaj (výsledky se zapisují v den
  // turnaje), jinak poslední odehraný.
  const upcoming = tournaments.filter((t) => t.status === "upcoming").at(-1);
  const selectedId =
    (typeof turnaj === "string" && tournaments.some((t) => t.id === turnaj) ? turnaj : undefined) ??
    upcoming?.id ??
    tournaments[0]?.id;
  const data = selectedId ? await getResultsOverview(selectedId) : null;

  // Zápasy po fázích ve stejném pořadí, v jakém se hrají.
  const stages = new Map<string, ResultMatchRow[]>();
  for (const m of data?.matches ?? []) stages.set(m.stage, [...(stages.get(m.stage) ?? []), m]);
  const done = data?.matches.filter((m) => m.homeGoals !== null).length ?? 0;

  return (
    <>
      <header className="cl-sectionhead">
        <span className="cl-sectionhead__over">Organizátor</span>
        <h1 style={h1Style}>Zapsat výsledky</h1>
        <p className="cl-sectionhead__sub">
          Vyber zápas a zapiš skóre, střelce a karty. Body se dopočítají samy. Po uložení se
          výsledek hned objeví v Odehraných zápasech.
        </p>
      </header>

      {!data ? (
        <Notice tone="info">
          Zatím tu není žádný turnaj. Založ ho v sekci <Link href="/portal/turnaje">Turnaje</Link>.
        </Notice>
      ) : (
        <>
          {tournaments.length > 1 && (
            <form method="get" className="res-picker" aria-label="Výběr turnaje">
              <SelectField id="res-turnaj" name="turnaj" label="Turnaj" defaultValue={data.tournament.id}>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({formatDate(t.startsOn)})
                  </option>
                ))}
              </SelectField>
              <button type="submit" className="cl-btn cl-btn--secondary">
                <span>Zobrazit</span>
              </button>
            </form>
          )}

          {/* ---- zápasy ---- */}
          <section aria-labelledby="vys-zapasy" className="flex flex-col gap-[var(--sp-5)]">
            <div className="flex flex-col gap-[var(--sp-2)]">
              <h2 id="vys-zapasy" style={h2Style}>
                {data.tournament.name}
              </h2>
              <p className="adm-meta" style={{ margin: 0 }}>
                <span className="cl-num">{formatDate(data.tournament.starts_on)}</span>
                <span>
                  Zapsáno {done} z {data.matches.length}
                </span>
                <Link href={`/portal/turnaje/${data.tournament.id}#zapasy`}>Upravit rozpis zápasů</Link>
                {data.tournament.status === "completed" && (
                  <Link href={`/turnaje/${data.tournament.slug}`}>
                    Veřejná stránka <ExternalLink size={12} strokeWidth={2} aria-hidden style={{ display: "inline" }} />
                  </Link>
                )}
              </p>
            </div>

            {data.matches.length === 0 ? (
              <Notice tone="accent">
                Turnaj zatím nemá žádné zápasy. Přidej je v{" "}
                <Link href={`/portal/turnaje/${data.tournament.id}#zapasy`}>rozpisu turnaje</Link>.
              </Notice>
            ) : (
              [...stages].map(([stage, list]) => (
                <div key={stage} className="flex flex-col gap-[var(--sp-3)]">
                  <h3 className="adm-sub">{stage}</h3>
                  <div className="cl-card">
                    <div className="cl-card__in">
                      <ul className="cl-card__body" aria-label={`Zápasy: ${stage}`}>
                        {list.map((m) => (
                          <MatchItem key={m.id} match={m} />
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* ---- umístění a postup ---- */}
          <section aria-labelledby="vys-poradi" className="flex flex-col gap-[var(--sp-5)]">
            <h2 id="vys-poradi" style={h2Style}>
              Umístění a postup
            </h2>
            <p className="cl-sectionhead__sub" style={{ margin: 0 }}>
              „Postoupil ze skupiny“ zvýrazní tým v tabulce skupiny. Konečné pořadí (1 = vítěz)
              tvoří stupně vítězů a celkové pořadí na stránce turnaje.
            </p>
            {data.entries.length === 0 ? (
              <Notice tone="info">Na turnaj zatím není přihlášený žádný tým.</Notice>
            ) : (
              <div className="cl-card">
                <div className="cl-card__in">
                  <ul className="cl-card__body" aria-label="Umístění týmů">
                    {data.entries.map((e) => (
                      <EntryRankingForm key={e.teamId} tournamentId={data.tournament.id} entry={e} />
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
