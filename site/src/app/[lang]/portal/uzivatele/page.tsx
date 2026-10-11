import type { Metadata } from "next";
import PortalHeader from "@/components/portal/PortalHeader";
import Notice from "@/components/ui/Notice";
import { fmt } from "@/i18n/format";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { listUsers } from "@/lib/admin/data";
import { formatPhone } from "@/lib/format";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.usersMetaTitle) };
}

export default async function PortalUzivatele() {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  const me = await requireRole("admin", locale);
  const users = await listUsers();

  return (
    <>
      <PortalHeader over={t.over} title={t.usersTitle} sub={t.usersSub} />

      <Notice tone="info">{t.usersRoles}</Notice>

      <div className="cl-card">
        <div className="cl-card__in">
          <ul className="cl-card__body" aria-label={t.usersTitle}>
            {users.map((u) => (
              <li key={u.id} className="adm-item" style={{ gap: "var(--sp-3)" }}>
                <div className="adm-item__head">
                  <span className="adm-item__title">{u.name || u.email}</span>
                  <span className={u.role === "captain" ? "cl-badge cl-badge--neutral" : "cl-badge"}>
                    {dict.labels.roles[u.role]}
                  </span>
                  {u.id === me.id && <span className="adm-meta">{t.itsYou}</span>}
                </div>
                <div className="adm-meta">
                  <a href={`mailto:${u.email}`}>{u.email}</a>
                  {u.phone && <a href={`tel:${u.phone}`}>{formatPhone(u.phone)}</a>}
                  {u.teamName && <span>{fmt(t.teamOf, { team: u.teamName })}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
