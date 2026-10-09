import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RosterManager from "@/components/portal/RosterManager";
import Notice from "@/components/ui/Notice";
import { PLAYERS_ACC, PLAYERS_NOM, plural } from "@/lib/plural";
import { getCaptainTeam, getOpenTournament } from "@/lib/portal/data";
import { PATHS } from "@/lib/portal/paths";
import { requireRole } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: "Hráči | Portál Clutch League",
};

const headingStyle = {
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

export default async function PortalHraci() {
  const user = await requireRole("captain");
  const [team, tournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);
  // Soupiska patří k týmu — bez přihlášky ho kapitán nejdřív přihlásí.
  if (!team) redirect(PATHS.teamRegistration);

  const minRoster = tournament?.minRoster ?? 1;
  const missing = Math.max(0, minRoster - team.players.length);

  return (
    <>
      <header className="cl-sectionhead">
        <span className="cl-sectionhead__over">Soupiska</span>
        <h1 style={headingStyle}>Hráči</h1>
        <p className="cl-sectionhead__sub">
          Přidávej, upravuj a maž hráče. Soupisku spravuješ jen ty jako kapitán.
        </p>
      </header>

      {missing > 0 && team.players.length > 0 && (
        <Notice tone="accent">
          Na turnaj potřebuješ aspoň {minRoster} {plural(minRoster, PLAYERS_ACC)}. Chybí ještě{" "}
          {missing} {plural(missing, PLAYERS_NOM)}.
        </Notice>
      )}

      <div className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body">
            <RosterManager players={team.players} minRoster={minRoster} />
          </div>
        </div>
      </div>
    </>
  );
}
