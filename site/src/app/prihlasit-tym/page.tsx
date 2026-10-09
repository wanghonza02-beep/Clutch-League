import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LogIn, LogOut, ShieldCheck, UserPlus, UserRound, Users } from "lucide-react";
import BackButton from "@/components/BackButton";
import SplitText from "@/components/ui/SplitText";
import Notice from "@/components/ui/Notice";
import EnterTournamentForm from "@/components/portal/EnterTournamentForm";
import RegistrationSteps from "@/components/portal/RegistrationSteps";
import TeamRegistrationForm from "@/components/portal/TeamRegistrationForm";
import { formatPhone } from "@/lib/format";
import { PLAYERS_ACC, PLAYERS_NOM, plural } from "@/lib/plural";
import ActionForm, { SubmitButton } from "@/components/ui/ActionForm";
import { logoutAction, withdrawTeamAction } from "@/lib/portal/actions";
import { getCaptainTeam, getOpenTournament, getTeamEntry } from "@/lib/portal/data";
import { PATHS, withNext } from "@/lib/portal/paths";
import { getSessionUser } from "@/lib/portal/session";
import { ENTRY_STATUS_LABEL, ROLE_LABEL, type OpenTournament } from "@/lib/portal/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Přihlásit tým | Clutch League",
  description: "Přihlas tým na turnaj Clutch League. Stačí se přihlásit, nebo si vytvořit účet.",
};

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

function Page({
  tournament,
  sub,
  children,
}: {
  tournament?: OpenTournament | null;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>
        <div className="cl-sectionhead">
          {tournament && (
            <span className="cl-sectionhead__over">
              {tournament.name} · <span className="cl-num">{tournament.dateLabel}</span>
            </span>
          )}
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text="Přihlásit tým"
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

  if (!isSupabaseConfigured()) {
    return (
      <Page sub="Přihlášky týmů běží přes databázi, která ještě není připojená.">
        <Notice tone="accent">
          Doplň klíče Supabase do souboru .env.local a restartuj server (viz supabase/README.md).
        </Notice>
      </Page>
    );
  }

  const tournament = await getOpenTournament();

  /* ---- registrace zavřená ---- */
  if (!tournament) {
    return (
      <Page sub="Přihlášky na turnaj jsou teď zavřené. Sleduj nás na Instagramu, ať ti neuteče další turnaj.">
        <div>
          <Link href="/turnaje" className="cl-btn cl-btn--secondary">
            <span>Odehrané turnaje</span>
          </Link>
        </div>
      </Page>
    );
  }

  /* ---- nepřihlášený: nejdřív přihlášení nebo účet ---- */
  if (!user) {
    return (
      <Page
        tournament={tournament}
        sub="Nejdřív se přihlas, nebo si vytvoř účet. Pak vyplníš přihlášku týmu a soupisku doplníš kdykoli potom."
      >
        <RegistrationSteps current={1} />

        <div className="cl-card cl-card--gold">
          <div className="cl-card__in">
            <span className="cl-card__raster" aria-hidden />
            <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
              <span style={{ color: "var(--gold)" }}>
                <ShieldCheck size={32} strokeWidth={2} aria-hidden />
              </span>
              <h2 style={cardTitle}>Nejdřív se přihlas</h2>
              <p style={{ margin: 0, color: "var(--text-body)" }}>
                Bez účtu tým přihlásit nejde. Potřebujeme vědět, kdo za tým odpovídá a jak ho
                zastihnout. Účet ti zároveň otevře portál, kde spravuješ soupisku hráčů.
              </p>
              <div className="flex flex-col gap-[var(--sp-3)] sm:flex-row">
                <Link
                  href={withNext(PATHS.signup, PATHS.teamRegistration)}
                  className="cl-btn cl-btn--primary"
                >
                  <UserPlus size={18} strokeWidth={2} aria-hidden />
                  <span>Vytvořit účet</span>
                </Link>
                <Link
                  href={withNext(PATHS.login, PATHS.teamRegistration)}
                  className="cl-btn cl-btn--secondary"
                >
                  <LogIn size={18} strokeWidth={2} aria-hidden />
                  <span>Přihlásit se</span>
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
      <Page tournament={tournament} sub="Tým přihlašuje jeho kapitán ze svého účtu.">
        <Notice tone="error">
          Teď je přihlášený účet s rolí {ROLE_LABEL[user.role]} ({user.email}). Tým přihlašuje jeho
          kapitán — odhlas se a přihlas se účtem, ze kterého tým spravuješ.
        </Notice>
        <form action={logoutAction}>
          <button type="submit" className="cl-btn cl-btn--secondary">
            <LogOut size={16} strokeWidth={2} aria-hidden />
            <span>Odhlásit se</span>
          </button>
        </form>
      </Page>
    );
  }

  const team = await getCaptainTeam(user.id);
  const entry = team ? await getTeamEntry(team.id, tournament.id) : null;

  /* ---- tým je přihlášený: stav přihlášky ---- */
  if (team && entry) {
    const rosterReady = team.players.length >= tournament.minRoster;

    return (
      <Page
        tournament={tournament}
        sub={
          rosterReady
            ? "Přihláška je odeslaná a soupiska má dost hráčů. Hotovo."
            : "Přihláška je odeslaná. Teď doplň soupisku hráčů."
        }
      >
        <RegistrationSteps current={rosterReady ? 4 : 3} />

        <div className="cl-card cl-card--gold" role="status">
          <div className="cl-card__in">
            <span className="cl-card__raster" aria-hidden />
            <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
              <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
                <span className={entry.status === "approved" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                  {ENTRY_STATUS_LABEL[entry.status]}
                </span>
                <span className="roster-row__meta" style={{ color: "var(--text-muted)" }}>
                  Kód týmu <span className="cl-num">{team.code}</span>
                </span>
              </div>

              <h2 style={cardTitle}>{team.name} je přihlášený</h2>
              <p style={{ margin: 0, color: "var(--text-body)" }}>
                Přihláška na {tournament.name} dorazila.{" "}
                {entry.status === "approved"
                  ? "Organizátor ji schválil, místo na turnaji máte jisté."
                  : "Organizátor ji teď zkontroluje a ozve se ti na e-mail nebo telefon."}
              </p>

              <dl className="hist-timeline__stats">
                <div className={`cl-stat${rosterReady ? "" : " cl-stat--accent"}`}>
                  <dt className="cl-stat__label">Na soupisce</dt>
                  <dd className="cl-stat__val order-first">
                    {team.players.length} {plural(team.players.length, PLAYERS_NOM)}
                  </dd>
                </div>
                <div className="cl-stat">
                  <dt className="cl-stat__label">Potřeba aspoň</dt>
                  <dd className="cl-stat__val order-first">
                    {tournament.minRoster} {plural(tournament.minRoster, PLAYERS_ACC)}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-[var(--sp-3)] sm:flex-row">
                <Link href="/portal/hraci" className="cl-btn cl-btn--primary">
                  <Users size={18} strokeWidth={2} aria-hidden />
                  <span>{rosterReady ? "Spravovat soupisku" : "Doplnit soupisku"}</span>
                </Link>
                <Link href={PATHS.portal} className="cl-btn cl-btn--ghost">
                  <span>Do portálu</span>
                  <ArrowRight size={16} strokeWidth={2} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Odhlášení z turnaje. Databáze ho pustí jen při otevřených přihláškách
            a dokud tým nemá zápas v rozpisu, jinak se ukáže hláška proč. */}
        <section id="odhlasit" aria-labelledby="odhlasit-title" className="flex flex-col gap-[var(--sp-3)]">
          <h2 id="odhlasit-title" className="cl-stat__label">
            Nemůžete hrát?
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
                confirm={`Opravdu odhlásit ${team.name} z turnaje ${tournament.name}?`}
                icon={<LogOut size={14} strokeWidth={2} aria-hidden />}
              >
                Odhlásit tým z turnaje
              </SubmitButton>
            </div>
          </ActionForm>
          <p className="cl-field__hint" style={{ margin: 0 }}>
            Tým i soupiska ti zůstanou, kdykoli ho můžeš přihlásit znovu, dokud jsou přihlášky
            otevřené.
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
            <span className="cl-stat__label">Kapitán týmu</span>
            <span className="roster-row__name">{user.name}</span>
            <span className="captain-card__contact">
              {user.email}
              {user.phone ? ` · ${formatPhone(user.phone)}` : ""}
            </span>
          </span>
          <form action={logoutAction}>
            <button type="submit" className="cl-btn cl-btn--ghost cl-btn--sm">
              <span>Nejsi to ty? Odhlásit</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  /* ---- kapitán s týmem z dřívějška: přihlášení na nový turnaj ---- */
  if (team) {
    return (
      <Page tournament={tournament} sub={`Tvůj tým ${team.name} na ${tournament.name} ještě přihlášený není.`}>
        <RegistrationSteps current={2} />
        {captainCard}
        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body flex flex-col gap-[var(--sp-5)]">
              <h2 style={cardTitle}>{team.name}</h2>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                {team.city} · {team.players.length} {plural(team.players.length, PLAYERS_NOM)} na
                soupisce. Údaje týmu změníš v{" "}
                <Link href="/portal/tym" style={{ color: "var(--text-link)" }}>
                  portálu
                </Link>
                .
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
    <Page tournament={tournament} sub="Účet máš. Vyplň údaje o týmu a odešli přihlášku.">
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
