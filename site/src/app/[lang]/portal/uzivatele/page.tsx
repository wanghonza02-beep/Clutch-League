import type { Metadata } from "next";
import UsersBrowser from "@/components/admin/UsersBrowser";
import PortalHeader from "@/components/portal/PortalHeader";
import Notice from "@/components/ui/Notice";
import { getDictionary, getI18n, portalTitle } from "@/i18n/server";
import { listUsers } from "@/lib/admin/data";
import { requireRole } from "@/lib/portal/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: portalTitle(t, t.admin.usersMetaTitle) };
}

/**
 * Všechny účty s kontakty a týmem. Hledání a filtr běží v prohlížeči hned při
 * psaní; ?q= a ?filtr= v adrese ho předvyplní (odkaz z Přehledu).
 */
export default async function PortalUzivatele({ searchParams }: PageProps<"/[lang]/portal/uzivatele">) {
  const { locale, t: dict } = await getI18n();
  const t = dict.admin;
  const me = await requireRole("admin", locale);
  const [{ users, tournament }, params] = await Promise.all([listUsers(), searchParams]);

  return (
    <>
      <PortalHeader over={t.over} title={t.usersTitle} sub={t.usersSub} />

      <UsersBrowser
        users={users}
        meId={me.id}
        tournamentName={tournament?.name ?? null}
        initialQuery={typeof params.q === "string" ? params.q : ""}
        initialFilter={typeof params.filtr === "string" ? params.filtr : "vse"}
      />

      <Notice tone="info">{t.usersRoles}</Notice>
    </>
  );
}
