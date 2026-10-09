import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TournamentForm from "@/components/admin/TournamentForm";
import Notice from "@/components/ui/Notice";
import { listTournaments } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: "Turnaje | Portál Clutch League",
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

export default async function PortalTurnaje() {
  await requireRole("admin");
  const tournaments = await listTournaments();

  return (
    <>
      <header className="cl-sectionhead">
        <span className="cl-sectionhead__over">Organizátor</span>
        <h1 style={headingStyle}>Turnaje</h1>
        <p className="cl-sectionhead__sub">
          Nadcházející i odehrané. U každého turnaje spravuješ týmy, zápasy, střelce a
          ocenění. Odehraný turnaj se sám objeví v archivu na webu.
        </p>
      </header>

      {tournaments.length === 0 ? (
        <Notice tone="info">Zatím tu není žádný turnaj. Založ první níže.</Notice>
      ) : (
        <div className="cl-card">
          <div className="cl-card__in">
            <ul className="cl-card__body" aria-label="Turnaje">
              {tournaments.map((t) => (
                <li key={t.id} className="adm-item" style={{ gap: "var(--sp-3)" }}>
                  <div className="adm-item__head">
                    <Link
                      href={`/portal/turnaje/${t.id}`}
                      className="adm-item__title"
                      style={{ textDecoration: "none" }}
                    >
                      {t.name}
                    </Link>
                    <span className={t.status === "upcoming" ? "cl-badge" : "cl-badge cl-badge--neutral"}>
                      {t.status === "upcoming" ? "Nadcházející" : "Odehráno"}
                    </span>
                    {t.registrationOpen && <span className="cl-badge">Přihlášky otevřené</span>}
                    <Link
                      href={`/portal/turnaje/${t.id}`}
                      className="cl-btn cl-btn--ghost cl-btn--sm"
                      style={{ marginLeft: "auto" }}
                    >
                      <span>Spravovat</span>
                      <ArrowRight size={14} strokeWidth={2} aria-hidden />
                    </Link>
                  </div>
                  <div className="adm-meta">
                    <span className="cl-num">{formatDate(t.startsOn)}</span>
                    {t.edition && <span>{t.edition}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <section aria-labelledby="novy-turnaj" className="flex flex-col gap-[var(--sp-5)]">
        <h2
          id="novy-turnaj"
          style={{ ...headingStyle, fontSize: "var(--fs-h3)" }}
        >
          Nový turnaj
        </h2>
        <div className="cl-card">
          <div className="cl-card__in">
            <div className="cl-card__body">
              <TournamentForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
