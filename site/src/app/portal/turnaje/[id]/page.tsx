import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardPen, ExternalLink, Trash2 } from "lucide-react";
import ActionForm, { SelectInput, SubmitButton, TextInput } from "@/components/ui/ActionForm";
import EntryRankingForm from "@/components/admin/EntryRankingForm";
import TournamentForm from "@/components/admin/TournamentForm";
import Notice from "@/components/ui/Notice";
import {
  addMatchAction,
  addScorerAction,
  deleteMatchAction,
  deleteScorerAction,
  deleteTournamentAction,
  saveAwardsAction,
  updateMatchAction,
} from "@/lib/admin/actions";
import { getAdminTournament, type AdminMatch } from "@/lib/admin/data";
import { isoToPragueLocal } from "@/lib/admin/helpers";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: "Turnaj | Portál Clutch League",
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

type Option = { value: string; label: string };

function MatchRow({ match, teams }: { match: AdminMatch; teams: Option[] }) {
  const played = match.homeGoals !== null && match.awayGoals !== null;
  return (
    <li className="adm-item">
      <div className="adm-item__head">
        <span className={played ? "cl-badge" : "cl-badge cl-badge--neutral"}>
          {played ? `Výsledek ${match.homeGoals}:${match.awayGoals}` : "Bez výsledku"}
        </span>
        <Link href={`/portal/vysledky/${match.id}`} className="cl-btn cl-btn--ghost cl-btn--sm">
          <ClipboardPen size={14} strokeWidth={2} aria-hidden />
          <span>{played ? "Upravit výsledek" : "Zapsat výsledek"}</span>
        </Link>
      </div>
      <ActionForm
        action={updateMatchAction}
        idPrefix={`m-${match.id}`}
        hidden={{ id: match.id }}
        className="flex flex-col gap-[var(--sp-4)]"
      >
        <div className="adm-grid adm-grid--wide">
          <TextInput name="stage" label="Fáze" fallback={match.stage} hint="Skupina A, Semifinále, Finále…" />
          <TextInput
            name="kickoff"
            label="Výkop (pražský čas)"
            type="datetime-local"
            fallback={isoToPragueLocal(match.kickoff)}
          />
        </div>
        <div className="adm-grid adm-grid--wide">
          <SelectInput name="homeTeamId" label="Domácí" fallback={match.homeTeamId} options={teams} />
          <SelectInput name="awayTeamId" label="Hosté" fallback={match.awayTeamId} options={teams} />
        </div>
        <div className="adm-grid adm-grid--wide">
          <TextInput name="clutchMode" label="Clutch Time" fallback={match.clutchMode} hint="Např. No Hands" />
        </div>
        <div>
          <SubmitButton size="sm" variant="secondary">
            Uložit zápas
          </SubmitButton>
        </div>
      </ActionForm>

      <ActionForm
        action={deleteMatchAction}
        idPrefix={`md-${match.id}`}
        hidden={{ id: match.id }}
        className="flex flex-col gap-[var(--sp-2)]"
      >
        <div>
          <SubmitButton
            variant="ghost"
            size="sm"
            confirm="Smazat zápas?"
            icon={<Trash2 size={14} strokeWidth={2} aria-hidden />}
          >
            Smazat zápas
          </SubmitButton>
        </div>
      </ActionForm>
    </li>
  );
}

export default async function PortalTurnajDetail({ params }: PageProps<"/portal/turnaje/[id]">) {
  await requireRole("admin");
  const { id } = await params;
  const data = await getAdminTournament(id);
  if (!data) notFound();

  const { tournament, entries, matches, scorers } = data;
  const teams: Option[] = entries.map((e) => ({ value: e.teamId, label: e.teamName }));
  const teamName = new Map(entries.map((e) => [e.teamId, e.teamName]));

  return (
    <>
      <div>
        <Link href="/portal/turnaje" className="cl-btn cl-btn--ghost cl-btn--sm cl-back">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          <span>Všechny turnaje</span>
        </Link>
      </div>

      <header className="cl-sectionhead">
        <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
          <span className={tournament.status === "upcoming" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
            {tournament.status === "upcoming" ? "Nadcházející" : "Odehráno"}
          </span>
          {tournament.registration_open && <span className="cl-badge">Přihlášky otevřené</span>}
        </div>
        <h1 style={h1Style}>{tournament.name}</h1>
        <p className="cl-sectionhead__sub">
          <span className="cl-num">{formatDate(tournament.starts_on)}</span>
          {tournament.status === "completed" && (
            <>
              {" "}
              ·{" "}
              <Link href={`/turnaje/${tournament.slug}`} style={{ color: "var(--text-link)" }}>
                Veřejná stránka <ExternalLink size={14} strokeWidth={2} aria-hidden style={{ display: "inline" }} />
              </Link>
            </>
          )}
        </p>
      </header>

      {/* ---- základní údaje ---- */}
      <section aria-labelledby="udaje" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="udaje" style={h2Style}>
          Základní údaje
        </h2>
        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <TournamentForm tournament={tournament} />
            </div>
          </div>
        </div>
      </section>

      {/* ---- týmy, skupiny a konečné pořadí ---- */}
      <section aria-labelledby="tymy" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="tymy" style={h2Style}>
          Týmy, skupiny a pořadí
        </h2>
        <p className="cl-sectionhead__sub" style={{ margin: 0 }}>
          Skupina se používá pro tabulky (A, B…). „Postoupil ze skupiny“ zvýrazní tým v tabulce.
          Konečné pořadí zadej po turnaji: 1 = vítěz. Na veřejném webu jsou vidět jen schválené týmy.
        </p>
        {entries.length === 0 ? (
          <Notice tone="info">Na turnaj zatím není přihlášený žádný tým.</Notice>
        ) : (
          <div className="cl-card">
            <div className="cl-card__in">
              <ul className="cl-card__body" aria-label="Týmy turnaje">
                {entries.map((e) => (
                  <EntryRankingForm key={e.teamId} tournamentId={tournament.id} entry={e} />
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ---- zápasy ---- */}
      <section aria-labelledby="zapasy" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="zapasy" style={h2Style}>
          Zápasy
        </h2>
        <p className="cl-sectionhead__sub" style={{ margin: 0 }}>
          Tady zakládáš rozpis (fáze, čas, týmy). Skóre, střelce a karty zapíšeš přes „Zapsat
          výsledek“. Zápasy fáze „Skupina…“ se samy počítají do tabulky.
        </p>

        {entries.length < 2 ? (
          <Notice tone="accent">Zápas jde přidat, až budou na turnaji aspoň dva týmy.</Notice>
        ) : (
          <>
            {matches.length > 0 && (
              <div className="cl-card">
                <div className="cl-card__in">
                  <ul className="cl-card__body" aria-label="Zápasy turnaje">
                    {matches.map((m) => (
                      <MatchRow key={m.id} match={m} teams={teams} />
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="cl-card cl-card--flat">
              <div className="cl-card__in">
                <div className="cl-card__body flex flex-col gap-[var(--sp-4)]">
                  <span className="adm-sub">Přidat zápas</span>
                  <ActionForm
                    action={addMatchAction}
                    idPrefix="m-new"
                    hidden={{ tournamentId: tournament.id }}
                    className="flex flex-col gap-[var(--sp-4)]"
                  >
                    <div className="adm-grid adm-grid--wide">
                      <TextInput name="stage" label="Fáze" hint="Skupina A, Semifinále, Finále…" />
                      <TextInput name="kickoff" label="Výkop (pražský čas)" type="datetime-local" />
                      <SelectInput name="homeTeamId" label="Domácí" options={teams} emptyLabel="Vyber tým" />
                      <SelectInput name="awayTeamId" label="Hosté" options={teams} emptyLabel="Vyber tým" />
                      <TextInput name="clutchMode" label="Clutch Time (nepovinné)" hint="Např. No Hands" />
                    </div>
                    <div>
                      <SubmitButton>Přidat zápas</SubmitButton>
                    </div>
                  </ActionForm>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ---- střelci ---- */}
      <section aria-labelledby="strelci" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="strelci" style={h2Style}>
          Střelci — ruční seznam
        </h2>
        <p className="cl-sectionhead__sub" style={{ margin: 0 }}>
          Když u zápasů zapíšeš góly se jmény, tabulka střelců se spočítá sama a tenhle seznam se
          nepoužije. Hodí se pro turnaje, kde známe jen celkové počty gólů, ne jednotlivé zápasy.
        </p>
        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
              {scorers.length > 0 && (
                <ul aria-label="Střelci turnaje">
                  {scorers.map((s) => (
                    <li key={s.id} className="roster-row">
                      <span className="roster-row__num cl-num" aria-hidden>
                        {s.goals}
                      </span>
                      <span className="flex flex-col gap-[2px]">
                        <span className="roster-row__name">{s.player}</span>
                        <span className="roster-row__meta">{teamName.get(s.teamId) ?? "Neznámý tým"}</span>
                      </span>
                      <span className="roster-row__actions">
                        <ActionForm
                          action={deleteScorerAction}
                          idPrefix={`sd-${s.id}`}
                          hidden={{ id: s.id }}
                          className="flex flex-col gap-[var(--sp-2)]"
                        >
                          <SubmitButton variant="ghost" size="sm" confirm="Smazat?" icon={<Trash2 size={14} strokeWidth={2} aria-hidden />}>
                            Smazat
                          </SubmitButton>
                        </ActionForm>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {entries.length === 0 ? (
                <Notice tone="info">Střelce jde přidat, až bude na turnaji nějaký tým.</Notice>
              ) : (
                <ActionForm
                  action={addScorerAction}
                  idPrefix="sc-new"
                  hidden={{ tournamentId: tournament.id }}
                  className="flex flex-col gap-[var(--sp-4)]"
                >
                  <span className="adm-sub">Přidat střelce</span>
                  <div className="adm-grid adm-grid--wide">
                    <TextInput name="player" label="Hráč" />
                    <SelectInput name="teamId" label="Tým" options={teams} emptyLabel="Vyber tým" />
                    <TextInput name="goals" label="Góly" inputMode="numeric" />
                  </div>
                  <div>
                    <SubmitButton variant="secondary">Přidat střelce</SubmitButton>
                  </div>
                </ActionForm>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---- ocenění ---- */}
      <section aria-labelledby="oceneni" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="oceneni" style={h2Style}>
          Individuální ocenění
        </h2>
        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <ActionForm
                action={saveAwardsAction}
                idPrefix="aw"
                hidden={{ tournamentId: tournament.id }}
                className="flex flex-col gap-[var(--sp-5)]"
              >
                <div className="adm-grid adm-grid--wide">
                  <TextInput name="mvpPlayer" label="Hráč turnaje" fallback={tournament.mvp_player} />
                  <SelectInput
                    name="mvpTeamId"
                    label="Tým hráče turnaje"
                    fallback={tournament.mvp_team_id ?? ""}
                    options={teams}
                    emptyLabel="—"
                  />
                  <TextInput name="keeperPlayer" label="Nejlepší brankář" fallback={tournament.best_keeper_player} />
                  <SelectInput
                    name="keeperTeamId"
                    label="Tým brankáře"
                    fallback={tournament.best_keeper_team_id ?? ""}
                    options={teams}
                    emptyLabel="—"
                  />
                </div>
                <div>
                  <SubmitButton variant="secondary">Uložit ocenění</SubmitButton>
                </div>
              </ActionForm>
            </div>
          </div>
        </div>
      </section>

      {/* ---- smazání ---- */}
      <section aria-labelledby="smazat" className="flex flex-col gap-[var(--sp-4)]">
        <h2 id="smazat" style={h2Style}>
          Smazat turnaj
        </h2>
        <Notice tone="error">
          Smaže turnaj včetně jeho přihlášek, zápasů a střelců. Týmy a účty kapitánů zůstanou.
          Nejde to vrátit.
        </Notice>
        <ActionForm
          action={deleteTournamentAction}
          idPrefix="trn-del"
          hidden={{ id: tournament.id }}
          className="flex flex-col gap-[var(--sp-2)]"
        >
          <div>
            <SubmitButton
              variant="secondary"
              confirm={`Opravdu smazat ${tournament.name}?`}
              icon={<Trash2 size={16} strokeWidth={2} aria-hidden />}
            >
              Smazat turnaj
            </SubmitButton>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
