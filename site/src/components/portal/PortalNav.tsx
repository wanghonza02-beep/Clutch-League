"use client";

import { usePathname } from "next/navigation";
import { CircleUser, ClipboardList, ClipboardPen, Inbox, LayoutDashboard, Trophy, UserCog, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/i18n/client";
import { splitLocale } from "@/i18n/config";
import Link from "@/i18n/Link";
import type { Role } from "@/lib/portal/types";

type Item = {
  href: string;
  label: "overview" | "myTeam" | "players" | "account" | "entries" | "results" | "tournaments" | "users";
  icon: LucideIcon;
};

const ACCOUNT: Item = { href: "/portal/ucet", label: "account", icon: CircleUser };

const ITEMS: Record<Role, Item[]> = {
  captain: [
    { href: "/portal", label: "overview", icon: LayoutDashboard },
    { href: "/portal/tym", label: "myTeam", icon: ClipboardList },
    { href: "/portal/hraci", label: "players", icon: Users },
    ACCOUNT,
  ],
  admin: [
    { href: "/portal", label: "overview", icon: LayoutDashboard },
    { href: "/portal/prihlasky", label: "entries", icon: Inbox },
    { href: "/portal/vysledky", label: "results", icon: ClipboardPen },
    { href: "/portal/turnaje", label: "tournaments", icon: Trophy },
    { href: "/portal/uzivatele", label: "users", icon: UserCog },
    ACCOUNT,
  ],
};

export default function PortalNav({ role }: { role: Role }) {
  const t = useT().portalNav;
  // Cesta bez jazykové předpony, ať zvýraznění funguje ve všech jazycích.
  const { path: pathname } = splitLocale(usePathname());

  return (
    <nav className="portal-nav" aria-label={t.label}>
      {ITEMS[role].map(({ href, label, icon: Icon }) => {
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
          </Link>
        );
      })}
    </nav>
  );
}
