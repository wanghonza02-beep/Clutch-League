import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardPen, ExternalLink, Trash2 } from "lucide-react";
import ActionForm, { SelectInput, SubmitButton, TextInput } from "@/components/ui/ActionForm";
import EntryRankingForm from "@/components/admin/EntryRankingForm";
import PortalHeader from "@/components/portal/PortalHeader";
import TournamentForm from "@/components/admin/TournamentForm";
import Notice from "@/components/ui/Notice";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import Link from "@/i18n/Link";
import type { Locale } from "@/i18n/config";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import {
  addMatchAction,
  addScorerAction,
  deleteMatchAction,
  deleteScorerAction,
  deleteTournamentAction,
  saveAwardsAction,
  updateMatchAction,
} from "@/lib/admin/actions";
import { getAdminTournament, type AdminEntryRow, type AdminMatch } from "@/lib/admin/data";
import { isoToPragueLocal } from "@/lib/admin/helpers";
import { formatDate, formatDateTime, pragueIsoDay } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.tournamentMetaTitle) };
}

type Option = { value: string; label: string };

/**
 * Výběr týmu: schválené týmy turnaje. Když už uložený záznam ukazuje na tým
 * bez schválené přihlášky, přidá se i ten (se stavem), ať se formulář neuloží
 * potichu s jiným týmem.
 */
function teamOptions(
  approved: Option[],
  entries: AdminEntryRow[],
  current: (string | null)[],
  dict: Dictionary,
): Option[] {
  const options = [...approved];
  for (const id of current) {
    if (!id || options.some((o) => o.value === id)) continue;
    const entry = entries.find((e) => e.teamId === id);
    options.push({
      value: id,
      label: entry ? `${entry.teamName} (${dict.labels.entryStatus[entry.status]})` : dict.admin.teamNotInTournament,
    });
  }
  return options;
}

function MatchRow({
  match,
  teams,
  warnings,
  t,
}: {
  match: AdminMatch;
  teams: Option[];
  warnings: string[];
  t: Dictionary["admin"];
}) {
  const played = match.homeGoals !== null && match.awayGoals !== null;
  return (
    <li className="adm-item">
      {warnings.map((w) => (
        <Notice key={w} tone="error">
          {w}
        </Notice>
      ))}
      <div className="adm-item__head">
        <span className={played ? "cl-badge" : "cl-badge cl-badge--neutral"}>
          {played ? fmt(t.result, { score: `${match.homeGoals}:${match.awayGoals}` }) : t.noResult}
        </span>
        <Link href={`/portal/vysledky/${match.id}`} className="cl-btn cl-btn--ghost cl-btn--sm">
          <ClipboardPen size={14} strokeWidth={2} aria-hidden />
          <span>{played ? t.editResult : t.writeResult}</span>
        </Link>
      </div>
      <ActionForm
        action={updateMatchAction}
        idPrefix={`m-${match.id}`}
        hidden={{ id: match.id }}
        className="flex flex-col gap-[var(--sp-4)]"
      >
        <div className="adm-grid adm-grid--wide">
          <TextInput name="stage" label={t.stage} fallback={match.stage} hint={t.stageHint} />
          <TextInput
            name="kickoff"
            label={t.kickoff}
            type="datetime-local"
            fallback={isoToPragueLocal(match.kickoff)}
          />
        </div>
        <div className="adm-grid adm-grid--wide">
          <SelectInput name="homeTeamId" label={t.home} fallback={match.homeTeamId} options={teams} />
          <SelectInput name="awayTeamId" label={t.away} fallback={match.awayTeamId} options={teams} />
        </div>
        <div className="adm-grid adm-grid--wide">
          <TextInput name="clutchMode" label={t.clutchTimeOptional} fallback={match.clutchMode} hint={t.clutchHint} />
        </div>
        <div>
          <SubmitButton size="sm" variant="secondary">
            {t.saveMatch}
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
            flush
            confirm={played ? t.deleteMatchPlayedConfirm : t.deleteMatchConfirm}
            icon={<Trash2 size={14} strokeWidth={2} aria-hidden />}
          >
            {t.deleteMatch}
          </SubmitButton>
        </div>
      </ActionForm>
    </li>
  );
}

export default async function PortalTurnajDetail({ params }: PageProps<"/[lang]/portal/turnaje/[id]">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  await requireRole("admin", locale);
  const { id } = await params;
  const data = await getAdminTournament(id);
  if (!data) notFound();

  const { tournament, entries, matches, scorers } = data;
  // Do rozpisu, střelců a ocenění jen schválené týmy — jen ty web ukazuje.
  const approved = entries.filter((e) => e.status === "approved");
  const teams: Option[] = approved.map((e) => ({
    value: e.teamId,
    label: e.teamName,
  }));
  const teamName = new Map(entries.map((e) => [e.teamId, e.teamName]));

  // Zápas, který k turnaji nesedí (jiný den, tým bez schválené přihlášky).
  const matchWarnings = (m: AdminMatch, locale: Locale): string[] => {
    const warnings: string[] = [];
    if (pragueIsoDay(m.kickoff) !== tournament.starts_on) {
      warnings.push(
        fmt(t.matchOffDay, {
          kickoff: formatDateTime(m.kickoff, locale),
          date: formatDate(tournament.starts_on, locale),
        }),
      );
    }
    for (const id of [m.homeTeamId, m.awayTeamId]) {
      const name = teamName.get(id);
      if (!name) warnings.push(t.matchTeamMissing);
      else if (!approved.some((e) => e.teamId === id)) warnings.push(fmt(t.matchTeamNotApproved, { team: name }));
    }
    return warnings;
  };

  return (
    <>
      <div>
        <Link href="/portal/turnaje" className="cl-btn cl-btn--ghost cl-btn--sm cl-back">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          <span>{t.allTournaments}</span>
        </Link>
      </div>

      <PortalHeader
        over={
          <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
            <span className={tournament.status === "upcoming" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
              {tournament.status === "upcoming" ? t.upcoming : t.completed}
            </span>
            {tournament.registration_open && <span className="cl-badge">{t.registrationOpen}</span>}
          </div>
        }
        title={tournament.name}
        sub={
          <>
            <span className="cl-num">{formatDate(tournament.starts_on, locale)}</span>
            {tournament.status === "completed" && (
              <>
                {" "}
                ·{" "}
                <Link href={`/turnaje/${tournament.slug}`} style={{ color: "var(--text-link)" }}>
                  {t.publicPage} <ExternalLink size={14} strokeWidth={2} aria-hidden style={{ display: "inline" }} />
                </Link>
              </>
            )}
          </>
        }
      />

      {/* ---- základní údaje ---- */}
      <section aria-labelledby="udaje" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="udaje" className="portal-h2">
          {t.basics}
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
        <h2 id="tymy" className="portal-h2">
          {t.teamsTitle}
        </h2>
        <p className="cl-sectionhead__sub" style={{ margin: 0 }}>
          {t.teamsSub}
        </p>
        {/* Skupinu a pořadí mají jen schválené týmy; o ostatních se rozhoduje v Přihláškách. */}
        {entries.length > approved.length && (
          <p className="adm-meta" style={{ margin: 0 }}>
            {fmt(t.notApprovedSummary, {
              pending: entries.filter((e) => e.status === "pending").length,
              rejected: entries.filter((e) => e.status === "rejected").length,
            })}{" "}
            <Link href="/portal/prihlasky">{t.notApprovedLink}</Link>
          </p>
        )}
        {approved.length === 0 ? (
          <Notice tone="info">{entries.length === 0 ? t.noTeams : t.noApprovedTeams}</Notice>
        ) : (
          <div className="cl-card">
            <div className="cl-card__in">
              <ul className="cl-card__body" aria-label={t.teamsLabel}>
                {approved.map((e) => (
                  <EntryRankingForm key={e.teamId} tournamentId={tournament.id} entry={e} />
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ---- zápasy ---- */}
      <section aria-labelledby="zapasy" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="zapasy" className="portal-h2">
          {t.matchesTitle}
        </h2>
        <p className="cl-sectionhead__sub" style={{ margin: 0 }}>
          {t.matchesSub}
        </p>

        {matches.length > 0 && (
          <div className="cl-card">
            <div className="cl-card__in">
              <ul className="cl-card__body" aria-label={t.matchesLabel}>
                {matches.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    teams={teamOptions(teams, entries, [m.homeTeamId, m.awayTeamId], dict)}
                    warnings={matchWarnings(m, locale)}
                    t={t}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {approved.length < 2 ? (
          <Notice tone="accent">{t.needTwoTeams}</Notice>
        ) : (
          <div className="cl-card cl-card--flat">
            <div className="cl-card__in">
              <div className="cl-card__body flex flex-col gap-[var(--sp-4)]">
                <span className="adm-sub">{t.addMatch}</span>
                <ActionForm
                  action={addMatchAction}
                  idPrefix="m-new"
                  hidden={{ tournamentId: tournament.id }}
                  className="flex flex-col gap-[var(--sp-4)]"
                >
                  <div className="adm-grid adm-grid--wide">
                    <TextInput name="stage" label={t.stage} hint={t.stageHint} />
                    <TextInput name="kickoff" label={t.kickoff} type="datetime-local" />
                    <SelectInput name="homeTeamId" label={t.home} options={teams} emptyLabel={t.pickTeam} />
                    <SelectInput name="awayTeamId" label={t.away} options={teams} emptyLabel={t.pickTeam} />
                    <TextInput name="clutchMode" label={t.clutchTimeOptional} hint={t.clutchHint} />
                  </div>
                  <div>
                    <SubmitButton>{t.addMatch}</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ---- střelci ---- */}
      <section aria-labelledby="strelci" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="strelci" className="portal-h2">
          {t.scorersTitle}
        </h2>
        <p className="cl-sectionhead__sub" style={{ margin: 0 }}>
          {t.scorersSub}
        </p>
        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
              {scorers.length > 0 && (
                <ul aria-label={t.scorersLabel}>
                  {scorers.map((s) => (
                    <li key={s.id} className="roster-row">
                      <span className="roster-row__num cl-num" aria-hidden>
                        {s.goals}
                      </span>
                      <span className="flex flex-col gap-[2px]">
                        <span className="roster-row__name">{s.player}</span>
                        <span className="roster-row__meta">{teamName.get(s.teamId) ?? dict.common.unknownTeam}</span>
                      </span>
                      <span className="roster-row__actions">
                        <ActionForm
                          action={deleteScorerAction}
                          idPrefix={`sd-${s.id}`}
                          hidden={{ id: s.id }}
                          className="flex flex-col gap-[var(--sp-2)]"
                        >
                          <SubmitButton
                            variant="ghost"
                            size="sm"
                            confirm={t.deleteConfirm}
                            icon={<Trash2 size={14} strokeWidth={2} aria-hidden />}
                          >
                            {t.delete}
                          </SubmitButton>
                        </ActionForm>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {entries.length === 0 ? (
                <Notice tone="info">{t.scorersNeedTeam}</Notice>
              ) : (
                <ActionForm
                  action={addScorerAction}
                  idPrefix="sc-new"
                  hidden={{ tournamentId: tournament.id }}
                  className="flex flex-col gap-[var(--sp-4)]"
                >
                  <span className="adm-sub">{t.addScorer}</span>
                  <div className="adm-grid adm-grid--wide">
                    <TextInput name="player" label={t.player} />
                    <SelectInput name="teamId" label={t.team} options={teams} emptyLabel={t.pickTeam} />
                    <TextInput name="goals" label={t.goals} inputMode="numeric" />
                  </div>
                  <div>
                    <SubmitButton variant="secondary">{t.addScorer}</SubmitButton>
                  </div>
                </ActionForm>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---- ocenění ---- */}
      <section aria-labelledby="oceneni" className="flex flex-col gap-[var(--sp-5)]">
        <h2 id="oceneni" className="portal-h2">
          {t.awardsTitle}
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
                  <TextInput name="mvpPlayer" label={t.mvp} fallback={tournament.mvp_player} />
                  <SelectInput
                    name="mvpTeamId"
                    label={t.mvpTeam}
                    fallback={tournament.mvp_team_id ?? ""}
                    options={teamOptions(teams, entries, [tournament.mvp_team_id], dict)}
                    emptyLabel="—"
                  />
                  <TextInput name="keeperPlayer" label={t.keeper} fallback={tournament.best_keeper_player} />
                  <SelectInput
                    name="keeperTeamId"
                    label={t.keeperTeam}
                    fallback={tournament.best_keeper_team_id ?? ""}
                    options={teamOptions(teams, entries, [tournament.best_keeper_team_id], dict)}
                    emptyLabel="—"
                  />
                </div>
                <div>
                  <SubmitButton variant="secondary">{t.saveAwards}</SubmitButton>
                </div>
              </ActionForm>
            </div>
          </div>
        </div>
      </section>

      {/* ---- smazání ---- */}
      <section aria-labelledby="smazat" className="flex flex-col gap-[var(--sp-4)]">
        <h2 id="smazat" className="portal-h2">
          {t.deleteTitle}
        </h2>
        <Notice tone="error">{t.deleteWarning}</Notice>
        <ActionForm
          action={deleteTournamentAction}
          idPrefix="trn-del"
          hidden={{ id: tournament.id }}
          className="flex flex-col gap-[var(--sp-2)]"
        >
          <div>
            <SubmitButton
              variant="secondary"
              confirm={fmt(t.deleteTournamentConfirm, {
                name: tournament.name,
              })}
              icon={<Trash2 size={16} strokeWidth={2} aria-hidden />}
            >
              {t.deleteTournament}
            </SubmitButton>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
