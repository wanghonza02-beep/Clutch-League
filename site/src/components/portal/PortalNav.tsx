"use client";

import { usePathname } from "next/navigation";
import { CalendarDays, CircleUser, ClipboardList, ClipboardPen, Inbox, LayoutDashboard, UserCog, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/i18n/client";
import { splitLocale } from "@/i18n/config";
import Link from "@/i18n/Link";
import type { Role } from "@/lib/portal/types";

type Label = "overview" | "myTeam" | "players" | "account" | "entries" | "schedule" | "results" | "users";

type Item = {
  href: string;
  label: Label;
  icon: LucideIcon;
};

/** Počty u položek lišty: nepřečtená oznámení (Přehled), čekající přihlášky (Přihlášky). */
export type PortalBadges = Partial<Record<Label, number>>;

const OVERVIEW: Item = { href: "/portal", label: "overview", icon: LayoutDashboard };
const ACCOUNT: Item = { href: "/portal/ucet", label: "account", icon: CircleUser };

// Kapitán spravuje svůj tým a soupisku. Organizátor vidí jen administraci —
// vlastní tým nemá (chce-li hrát, má samostatný kapitánský účet).
const ITEMS: Record<Role, Item[]> = {
  captain: [
    OVERVIEW,
    { href: "/portal/tym", label: "myTeam", icon: ClipboardList },
    { href: "/portal/hraci", label: "players", icon: Users },
    ACCOUNT,
  ],
  admin: [
    OVERVIEW,
    { href: "/portal/prihlasky", label: "entries", icon: Inbox },
    { href: "/portal/turnaje", label: "schedule", icon: CalendarDays },
    { href: "/portal/vysledky", label: "results", icon: ClipboardPen },
    { href: "/portal/uzivatele", label: "users", icon: UserCog },
    ACCOUNT,
  ],
};

export default function PortalNav({ role, badges = {} }: { role: Role; badges?: PortalBadges }) {
  const t = useT().portalNav;
  // Cesta bez jazykové předpony, ať zvýraznění funguje ve všech jazycích.
  const { path: pathname } = splitLocale(usePathname());

  return (
    <nav className="portal-nav" aria-label={t.label}>
      {ITEMS[role].map(({ href, label, icon: Icon }) => {
        // Přehled: /portal a přehled turnaje (/portal/prehled/…), ostatní sekce
        // drží zvýraznění i na svých podstránkách.
        const active =
          href === "/portal"
            ? pathname === href || pathname.startsWith("/portal/prehled/")
            : pathname === href || pathname.startsWith(`${href}/`);
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
