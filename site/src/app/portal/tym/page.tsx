import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Notice from "@/components/ui/Notice";
import TeamForm from "@/components/portal/TeamForm";
import { getCaptainTeam } from "@/lib/portal/data";
import { PATHS } from "@/lib/portal/paths";
import { requireRole } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: "Můj tým | Portál Clutch League",
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

export default async function PortalTym() {
  const user = await requireRole("captain");
  const team = await getCaptainTeam(user.id);
  // Tým vzniká jen přihláškou — bez ní není co upravovat.
  if (!team) redirect(PATHS.teamRegistration);

  return (
    <>
      <header className="cl-sectionhead">
        <span className="cl-sectionhead__over">Tým</span>
        <h1 style={headingStyle}>Údaje týmu</h1>
        <p className="cl-sectionhead__sub">Změny se projeví hned. Kód týmu zůstává stejný.</p>
      </header>

      <Notice tone="info">
        Kód týmu <span className="cl-num">{team.code}</span> uváděj, když budeš psát
        organizátorovi.
      </Notice>

      <div className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body">
            <TeamForm team={team} />
          </div>
        </div>
      </div>
    </>
  );
}
