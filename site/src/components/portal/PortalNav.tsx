"use client";

import { usePathname } from "next/navigation";
import { CircleUser, ClipboardList, ClipboardPen, Inbox, LayoutDashboard, Trophy, UserCog, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/i18n/client";
import { splitLocale } from "@/i18n/config";
import Link from "@/i18n/Link";
import type { Role } from "@/lib/portal/types";

type Label = "overview" | "myTeam" | "players" | "account" | "entries" | "results" | "tournaments" | "users";

type Item = {
  href: string;
  label: Label;
  icon: LucideIcon;
};

/** Počty u položek lišty: nepřečtená oznámení (Přehled), čekající přihlášky (Přihlášky). */
export type PortalBadges = Partial<Record<Label, number>>;

const ACCOUNT: Item = { href: "/portal/ucet", label: "account", icon: CircleUser };
const TEAM_ITEMS: Item[] = [
  { href: "/portal/tym", label: "myTeam", icon: ClipboardList },
  { href: "/portal/hraci", label: "players", icon: Users },
];

const ITEMS: Record<Role, Item[]> = {
  captain: [{ href: "/portal", label: "overview", icon: LayoutDashboard }, ...TEAM_ITEMS, ACCOUNT],
  admin: [
    { href: "/portal", label: "overview", icon: LayoutDashboard },
    { href: "/portal/prihlasky", label: "entries", icon: Inbox },
    { href: "/portal/vysledky", label: "results", icon: ClipboardPen },
    { href: "/portal/turnaje", label: "tournaments", icon: Trophy },
    { href: "/portal/uzivatele", label: "users", icon: UserCog },
    ACCOUNT,
  ],
};

/**
 * `ownsTeam`: organizátor, který má vlastní tým (např. hraje za něj), spravuje
 * jeho údaje a soupisku stejně jako kapitán.
 */
export default function PortalNav({
  role,
  badges = {},
  ownsTeam = false,
}: {
  role: Role;
  badges?: PortalBadges;
  ownsTeam?: boolean;
}) {
  const t = useT().portalNav;
  // Cesta bez jazykové předpony, ať zvýraznění funguje ve všech jazycích.
  const { path: pathname } = splitLocale(usePathname());

  return (
    <nav className="portal-nav" aria-label={t.label}>
      {(role === "admin" && ownsTeam
        ? [...ITEMS.admin.slice(0, -1), ...TEAM_ITEMS, ACCOUNT]
        : ITEMS[role]
      ).map(({ href, label, icon: Icon }) => {
        // Přehled je jen přesná shoda, ostatní drží zvýraznění i na podstránkách.
        const active = href === "/portal" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`portal-nav__link${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={16} strokeWidth={2} aria-hidden />
            {t[label]}
            {(badges[label] ?? 0) > 0 && (
              <span className="portal-nav__badge">
                <span aria-hidden>{badges[label]}</span>
                <span className="sr-only">{` (${t.badge.replace("{n}", String(badges[label]))})`}</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
