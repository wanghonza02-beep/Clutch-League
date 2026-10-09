"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser, ClipboardList, ClipboardPen, Inbox, LayoutDashboard, Trophy, UserCog, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/portal/types";

type Item = { href: string; label: string; icon: LucideIcon };

const ACCOUNT: Item = { href: "/portal/ucet", label: "Můj účet", icon: CircleUser };

const ITEMS: Record<Role, Item[]> = {
  captain: [
    { href: "/portal", label: "Přehled", icon: LayoutDashboard },
    { href: "/portal/tym", label: "Můj tým", icon: ClipboardList },
    { href: "/portal/hraci", label: "Hráči", icon: Users },
    ACCOUNT,
  ],
  admin: [
    { href: "/portal", label: "Přehled", icon: LayoutDashboard },
    { href: "/portal/prihlasky", label: "Přihlášky", icon: Inbox },
    { href: "/portal/vysledky", label: "Zapsat výsledky", icon: ClipboardPen },
    { href: "/portal/turnaje", label: "Turnaje", icon: Trophy },
    { href: "/portal/uzivatele", label: "Uživatelé", icon: UserCog },
    ACCOUNT,
  ],
};

export default function PortalNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="portal-nav" aria-label="Portál">
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
