import type { Metadata } from "next";
import { Check, Undo2, X } from "lucide-react";
import ActionForm, { SubmitButton } from "@/components/ui/ActionForm";
import Notice from "@/components/ui/Notice";
import { removeEntryAction, setEntryStatusAction } from "@/lib/admin/actions";
import { listPendingTournamentEntries } from "@/lib/admin/data";
import { formatDate, formatPhone } from "@/lib/format";
import { plural, PLAYERS_NOM } from "@/lib/plural";
import { requireRole } from "@/lib/portal/session";
import { ENTRY_STATUS_LABEL } from "@/lib/portal/types";

export const metadata: Metadata = {
  title: "Přihlášky | Portál Clutch League",
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

export default async function PortalPrihlasky() {
  await requireRole("admin");
  const entries = await listPendingTournamentEntries();
  const pending = entries.filter((e) => e.status === "pending").length;

  return (
    <>
      <header className="cl-sectionhead">
        <span className="cl-sectionhead__over">Organizátor</span>
        <h1 style={headingStyle}>Přihlášky týmů</h1>
        <p className="cl-sectionhead__sub">
          {pending > 0
            ? `Čeká ${pending} ${pending === 1 ? "přihláška" : pending < 5 ? "přihlášky" : "přihlášek"} na schválení.`
            : "Všechny přihlášky jsou vyřízené."}{" "}
          Schválený tým se objeví ve veřejných výsledcích turnaje.
        </p>
      </header>

      {entries.length === 0 ? (
        <Notice tone="info">
          Zatím se na žádný nadcházející turnaj nikdo nepřihlásil. Přihlášky se otevírají u
          turnaje v sekci Turnaje.
        </Notice>
      ) : (
        <div className="cl-card">
          <div className="cl-card__in">
            <ul className="cl-card__body" aria-label="Přihlášky týmů">
              {entries.map((e) => (
                <li key={`${e.tournamentId}-${e.teamId}`} className="adm-item">
                  <div className="adm-item__head">
                    <span className="adm-item__title">{e.teamName}</span>
                    <span className={e.status === "approved" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                      {ENTRY_STATUS_LABEL[e.status]}
                    </span>
                  </div>

                  <div className="adm-meta">
                    <span>
                      {e.tournamentName} · <span className="cl-num">{formatDate(e.startsOn)}</span>
                    </span>
                    <span>{e.city}</span>
                    <span>
                      {e.playerCount} {plural(e.playerCount, PLAYERS_NOM)} na soupisce
                    </span>
                    <span>
                      Kód <span className="cl-num">{e.code}</span>
                    </span>
                  </div>

                  {e.captain ? (
                    <div className="adm-meta">
                      <span>Kapitán {e.captain.name}</span>
                      <a href={`mailto:${e.captain.email}`}>{e.captain.email}</a>
                      {e.captain.phone && <a href={`tel:${e.captain.phone}`}>{formatPhone(e.captain.phone)}</a>}
                    </div>
                  ) : (
                    <div className="adm-meta">
                      <span>Tým nemá přiřazeného kapitána.</span>
                    </div>
                  )}

                  {e.note && (
                    <p className="adm-meta" style={{ margin: 0 }}>
                      Poznámka: {e.note}
                    </p>
                  )}

                  <div className="adm-actions">
                    <ActionForm
                      action={setEntryStatusAction}
                      idPrefix={`st-${e.teamId}`}
                      hidden={{
                        tournamentId: e.tournamentId,
                        teamId: e.teamId,
                        status: e.status === "approved" ? "pending" : "approved",
                      }}
                      className="flex flex-col gap-[var(--sp-2)]"
                    >
                      {e.status === "approved" ? (
                        <SubmitButton variant="ghost" size="sm" icon={<Undo2 size={14} strokeWidth={2} aria-hidden />}>
                          Vrátit ke schválení
                        </SubmitButton>
                      ) : (
                        <SubmitButton size="sm" icon={<Check size={14} strokeWidth={2.5} aria-hidden />}>
                          Schválit
                        </SubmitButton>
                      )}
                    </ActionForm>

                    <ActionForm
                      action={removeEntryAction}
                      idPrefix={`rm-${e.teamId}`}
                      hidden={{ tournamentId: e.tournamentId, teamId: e.teamId }}
                      className="flex flex-col gap-[var(--sp-2)]"
                    >
                      <SubmitButton
                        variant="ghost"
                        size="sm"
                        confirm="Odmítnout přihlášku?"
                        icon={<X size={14} strokeWidth={2} aria-hidden />}
                      >
                        Odmítnout
                      </SubmitButton>
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
