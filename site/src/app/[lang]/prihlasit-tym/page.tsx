import type { Metadata } from "next";
import { LogIn, LogOut, ShieldCheck, UserPlus, UserRound, Users } from "lucide-react";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import EnterTournamentForm from "@/components/portal/EnterTournamentForm";
import RegistrationSteps from "@/components/portal/RegistrationSteps";
import TeamRegistrationForm from "@/components/portal/TeamRegistrationForm";
import ActionForm, { SubmitButton } from "@/components/ui/ActionForm";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import LocaleField from "@/i18n/LocaleField";
import { rich } from "@/i18n/rich";
import { getDictionary, getI18n, pageTitle } from "@/i18n/server";
import { formatDate, formatPhone } from "@/lib/format";
import { logoutAction, withdrawTeamAction } from "@/lib/portal/actions";
import { getCaptainTeam, getOpenTournament, getTeamEntry } from "@/lib/portal/data";
import { PATHS, withNext } from "@/lib/portal/paths";
import { getSessionUser } from "@/lib/portal/session";
import type { OpenTournament } from "@/lib/portal/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: pageTitle(t, t.registration.metaTitle),
    description: t.registration.metaDescription,
  };
}

const cardTitle = {
  fontFamily: "var(--font-display)",
  fontWeight: "var(--fw-display)",
  fontStyle: "italic",
  fontSize: "var(--fs-h3)",
  lineHeight: "var(--lh-heading)",
  letterSpacing: "var(--ls-display)",
  textTransform: "uppercase",
  color: "var(--text-heading)",
  margin: 0,
} as const;

async function Page({
  tournament,
  sub,
  children,
}: {
  tournament?: OpenTournament | null;
  sub: string;
  children: React.ReactNode;
}) {
  const { locale, t } = await getI18n();
  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>
        <div className="cl-sectionhead">
          {tournament && (
            <span className="cl-sectionhead__over">
              {tournament.name} · <span className="cl-num">{formatDate(tournament.startsOn, locale)}</span>
            </span>
          )}
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text={t.registration.title}
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">{sub}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

/**
 * Přihláška týmu. Odkazy „Přihlásit tým“ z celého webu vedou sem a stránka
 * podle přihlášení ukáže správný krok:
 *   nepřihlášený          → nejdřív přihlášení nebo nový účet,
 *   organizátor           → tým přihlašuje jen jeho kapitán,
 *   kapitán bez týmu      → formulář přihlášky nového týmu,
 *   kapitán s týmem       → přihlášení týmu na aktuální turnaj,
 *   tým už je přihlášený  → stav přihlášky a odkaz na soupisku.
 * Zámek drží i databáze (RLS) — tahle stránka je jen UI.
 */
export default async function PrihlasitTym() {
  // Nejdřív session — getSessionUser zároveň drží stránku dynamickou.
  const user = await getSessionUser();
  const { locale, t: dict } = await getI18n();
  const t = dict.registration;

  if (!isSupabaseConfigured()) {
    return (
      <Page sub={t.notConfiguredSub}>
        <Notice tone="accent">{t.notConfigured}</Notice>
      </Page>
    );
  }

  const tournament = await getOpenTournament();

  /* ---- registrace zavřená ---- */
  if (!tournament) {
    return (
      <Page sub={t.closedSub}>
        <div>
          <Link href="/turnaje" className="cl-btn cl-btn--secondary">
            <span>{t.playedTournaments}</span>
          </Link>
        </div>
      </Page>
    );
  }

  /* ---- nepřihlášený: nejdřív přihlášení nebo účet ---- */
  if (!user) {
    return (
      <Page tournament={tournament} sub={t.guestSub}>
        <RegistrationSteps current={1} />

        <div className="cl-card cl-card--gold">
          <div className="cl-card__in">
            <span className="cl-card__raster" aria-hidden />
            <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
              <span style={{ color: "var(--gold)" }}>
                <ShieldCheck size={32} strokeWidth={2} aria-hidden />
              </span>
              <h2 style={cardTitle}>{t.guestTitle}</h2>
              <p style={{ margin: 0, color: "var(--text-body)" }}>{t.guestText}</p>
              <div className="flex flex-col gap-[var(--sp-3)] sm:flex-row">
                <Link
                  href={withNext(PATHS.signup, PATHS.teamRegistration)}
                  className="cl-btn cl-btn--primary"
                >
                  <UserPlus size={18} strokeWidth={2} aria-hidden />
                  <span>{dict.common.createAccount}</span>
                </Link>
                <Link
                  href={withNext(PATHS.login, PATHS.teamRegistration)}
                  className="cl-btn cl-btn--secondary"
                >
                  <LogIn size={18} strokeWidth={2} aria-hidden />
                  <span>{dict.common.login}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  /* ---- organizátor: tým nepřihlašuje ---- */
  if (user.role !== "captain") {
    return (
      <Page tournament={tournament} sub={t.adminSub}>
        <Notice tone="error">
          {fmt(t.adminNotice, { role: dict.labels.roles[user.role], email: user.email })}
        </Notice>
        <form action={logoutAction}>
          <LocaleField />
          <button type="submit" className="cl-btn cl-btn--secondary">
            <LogOut size={16} strokeWidth={2} aria-hidden />
            <span>{dict.common.logout}</span>
          </button>
        </form>
      </Page>
    );
  }

  const team = await getCaptainTeam(user.id);
  const entry = team ? await getTeamEntry(team.id, tournament.id) : null;

  /* ---- tým je přihlášený: stav přihlášky ---- */
  if (team && entry) {
    const count = team.players.length;
    const overMax = count > tournament.maxRoster;
    const rosterReady = count >= tournament.minRoster && !overMax;

    return (
      <Page tournament={tournament} sub={overMax ? t.overSub : rosterReady ? t.readySub : t.missingSub}>
        <RegistrationSteps current={rosterReady ? 4 : 3} />

        <div className="cl-card cl-card--gold" role="status">
          <div className="cl-card__in">
            <span className="cl-card__raster" aria-hidden />
            <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
              <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
                <span className={entry.status === "approved" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                  {dict.labels.entryStatus[entry.status]}
                </span>
                <span className="roster-row__meta" style={{ color: "var(--text-muted)" }}>
                  {rich(t.teamCode, { code: <span className="cl-num">{team.code}</span> })}
                </span>
              </div>

              <h2 style={cardTitle}>{fmt(t.entered, { team: team.name })}</h2>
              <p style={{ margin: 0, color: "var(--text-body)" }}>
                {fmt(t.arrived, { tournament: tournament.name })}{" "}
                {entry.status === "approved" ? t.approved : t.pending}
              </p>

              <dl className="hist-timeline__stats">
                <div className={`cl-stat${rosterReady ? "" : " cl-stat--accent"}`}>
                  <dt className="cl-stat__label">{t.onRoster}</dt>
                  <dd className="cl-stat__val order-first">{plural(locale, count, dict.counts.players)}</dd>
                </div>
                <div className="cl-stat">
                  <dt className="cl-stat__label">{t.atLeast}</dt>
                  <dd className="cl-stat__val order-first">
                    {plural(locale, tournament.minRoster, dict.counts.playersAcc)}
                  </dd>
                </div>
                <div className="cl-stat">
                  <dt className="cl-stat__label">{t.atMost}</dt>
                  <dd className="cl-stat__val order-first">
                    {plural(locale, tournament.maxRoster, dict.counts.players)}
                  </dd>
                </div>
              </dl>

              <div>
                <Link href="/portal/hraci" className="cl-btn cl-btn--primary">
                  <Users size={18} strokeWidth={2} aria-hidden />
                  <span>{rosterReady ? t.manageRoster : t.fillRoster}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Odhlášení z turnaje. Databáze ho pustí jen při otevřených přihláškách
            a dokud tým nemá zápas v rozpisu, jinak se ukáže hláška proč. */}
        <section id="odhlasit" aria-labelledby="odhlasit-title" className="flex flex-col gap-[var(--sp-3)]">
          <h2 id="odhlasit-title" className="cl-stat__label">
            {t.cantPlay}
          </h2>
          <ActionForm
            action={withdrawTeamAction}
            idPrefix="withdraw"
            hidden={{ tournamentId: tournament.id }}
            className="flex flex-col gap-[var(--sp-3)]"
          >
            <div>
              <SubmitButton
                variant="ghost"
                size="sm"
                flush
                confirm={fmt(t.withdrawConfirm, { team: team.name, tournament: tournament.name })}
                icon={<LogOut size={14} strokeWidth={2} aria-hidden />}
              >
                {t.withdraw}
              </SubmitButton>
            </div>
          </ActionForm>
          <p className="cl-field__hint" style={{ margin: 0 }}>
            {t.withdrawNote}
          </p>
        </section>
      </Page>
    );
  }

  const captainCard = (
    <div className="cl-card cl-card--flat">
      <div className="cl-card__in">
        <div className="cl-card__body captain-card">
          <span className="captain-card__avatar" aria-hidden>
            <UserRound size={20} strokeWidth={2} />
          </span>
          <span className="captain-card__who">
            <span className="cl-stat__label">{t.captain}</span>
            <span className="roster-row__name">{user.name}</span>
            <span className="captain-card__contact">
              {user.email}
              {user.phone ? ` · ${formatPhone(user.phone)}` : ""}
            </span>
          </span>
          <form action={logoutAction}>
            <LocaleField />
            <button type="submit" className="cl-btn cl-btn--ghost cl-btn--sm">
              <span>{t.notYou}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  /* ---- kapitán s týmem z dřívějška: přihlášení na nový turnaj ---- */
  if (team) {
    return (
      <Page tournament={tournament} sub={fmt(t.existingSub, { team: team.name, tournament: tournament.name })}>
        <RegistrationSteps current={2} />
        {captainCard}
        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
              <h2 style={cardTitle}>{team.name}</h2>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                {rich(t.existingText, {
                  city: team.city ? `${team.city} · ` : "",
                  count: plural(locale, team.players.length, dict.counts.players),
                  link: (
                    <Link href="/portal/tym" style={{ color: "var(--text-link)" }}>
                      {t.existingLink}
                    </Link>
                  ),
                })}
              </p>
              <EnterTournamentForm tournament={tournament.name} />
            </div>
          </div>
        </div>
      </Page>
    );
  }

  /* ---- kapitán bez týmu: přihláška nového týmu ---- */
  return (
    <Page tournament={tournament} sub={t.newTeamSub}>
      <RegistrationSteps current={2} />
      {captainCard}
      <div className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body">
            <TeamRegistrationForm />
          </div>
        </div>
      </div>
    </Page>
  );
}
