import type { Metadata } from "next";
import Notice from "@/components/ui/Notice";
import { listUsers } from "@/lib/admin/data";
import { formatPhone } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";
import { ROLE_LABEL } from "@/lib/portal/types";

export const metadata: Metadata = {
  title: "Uživatelé | Portál Clutch League",
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

export default async function PortalUzivatele() {
  const me = await requireRole("admin");
  const users = await listUsers();

  return (
    <>
      <header className="cl-sectionhead">
        <span className="cl-sectionhead__over">Organizátor</span>
        <h1 style={headingStyle}>Uživatelé</h1>
        <p className="cl-sectionhead__sub">
          Všechny účty na webu s kontakty. Kapitáni vznikají registrací.
        </p>
      </header>

      <Notice tone="info">
        Role se z webu měnit nedá. Dalšího organizátora uděláš v Supabase: Table Editor →
        profiles → u dotyčného přepiš sloupec role na „admin“. Pak se musí odhlásit a znovu
        přihlásit.
      </Notice>

      <div className="cl-card">
        <div className="cl-card__in">
          <ul className="cl-card__body" aria-label="Uživatelé">
            {users.map((u) => (
              <li key={u.id} className="adm-item" style={{ gap: "var(--sp-3)" }}>
                <div className="adm-item__head">
                  <span className="adm-item__title">{u.name || u.email}</span>
                  <span className={u.role === "captain" ? "cl-badge cl-badge--neutral" : "cl-badge"}>
                    {ROLE_LABEL[u.role]}
                  </span>
                  {u.id === me.id && <span className="adm-meta">To jsi ty</span>}
                </div>
                <div className="adm-meta">
                  <a href={`mailto:${u.email}`}>{u.email}</a>
                  {u.phone && <a href={`tel:${u.phone}`}>{formatPhone(u.phone)}</a>}
                  {u.teamName && <span>Tým {u.teamName}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
