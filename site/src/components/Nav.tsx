"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, ShieldCheck, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SectionLink from "@/components/SectionLink";
import { REVIEWS } from "@/content/reviews";
import { recordPath } from "@/lib/navHistory";
import { PATHS } from "@/lib/portal/paths";
import type { Role } from "@/lib/portal/types";
import { scrollToTop } from "@/lib/sectionScroll";

type NavLink = {
  label: string;
  /** Sekce úvodní stránky (id), nebo… */
  section?: string;
  /** …samostatná stránka. */
  href?: string;
  /** Cesty, na kterých je odkaz zvýrazněný (podstránky). */
  match?: string[];
};

// Pořadí odpovídá sekcím na úvodní stránce.
const LINKS: NavLink[] = [
  { section: "jak-to-funguje", label: "Jak to funguje" },
  { section: "pravidla", label: "Pravidla" },
  // Sekce s recenzemi se bez nich neukazuje, tak ani odkaz na ni.
  ...(REVIEWS.length > 0 ? [{ section: "proc-clutch-league", label: "Proč my" }] : []),
  { section: "odehrane-zapasy", label: "Odehrané zápasy", match: ["/turnaje"] },
  { section: "fotky", label: "Fotky" },
  { href: "/kontakt", label: "Kontakt", match: ["/kontakt"] },
];

type Account = { href: string; label: string; icon: LucideIcon };

// Přihlásit se může kdokoli s účtem (kapitán, admin).
// Přihlášenému ukáže rovnou cestu do jeho části portálu.
const ACCOUNT: Record<"guest" | Role, Account> = {
  guest: { href: PATHS.login, label: "Přihlásit se", icon: LogIn },
  captain: { href: PATHS.portal, label: "Můj tým", icon: Users },
  admin: { href: PATHS.portal, label: "Administrace", icon: ShieldCheck },
};

/**
 * Role přihlášeného uživatele, nebo null. Navigace je v kořenovém layoutu,
 * takže stav přihlášení čte z prohlížeče (/api/session) — kdyby četla cookie
 * na serveru, žádná stránka webu by nešla vyrenderovat staticky. Přenačítá se
 * při změně stránky, protože přihlášení i odhlášení končí přesměrováním.
 */
function useSessionRole(pathname: string): Role | null {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { role: null }))
      .then((data: { role: Role | null }) => {
        if (alive) setRole(data.role);
      })
      .catch(() => {
        // Bez spojení zůstane navigace v režimu nepřihlášeného — nic se nerozbije.
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  return role;
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const role = useSessionRole(pathname);
  const account = ACCOUNT[role ?? "guest"];
  const AccountIcon = account.icon;

  useEffect(() => recordPath(pathname), [pathname]);

  const linkClass = (link: NavLink) => {
    const active = (link.match ?? []).some((base) => pathname === base || pathname.startsWith(`${base}/`));
    return {
      className: `cl-nav__link${active ? " is-active" : ""}`,
      "aria-current": active ? ("page" as const) : undefined,
    };
  };

  // Logo vede vždy na úplný začátek webu. Na úvodní stránce by Next při
  // stejné adrese nescrolloval (a kotva by zůstala), proto se sjede ručně.
  const onLogoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    if (pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    scrollToTop();
  };

  const renderLink = (link: NavLink, inDrawer: boolean) =>
    link.section ? (
      <SectionLink
        key={link.label}
        section={link.section}
        {...linkClass(link)}
        onNavigate={inDrawer ? () => setOpen(false) : undefined}
      >
        {link.label}
      </SectionLink>
    ) : (
      <Link
        key={link.label}
        href={link.href ?? "/"}
        {...linkClass(link)}
        onClick={inDrawer ? () => setOpen(false) : undefined}
      >
        {link.label}
      </Link>
    );

  return (
    <header className="site-header">
      <nav className="cl-nav" aria-label="Hlavní navigace">
        <Link href="/" className="cl-logo" aria-label="Clutch League, na začátek" onClick={onLogoClick}>
          <span className="cl-logo__type">
            <span className="cl-logo__word" style={{ fontSize: "20px" }}>
              Clutch
            </span>
            <span className="cl-logo__sub" style={{ fontSize: "10px" }}>
              League
            </span>
          </span>
        </Link>

        <div className="cl-nav__links">
          {LINKS.map((link) => renderLink(link, false))}
          <Link href={account.href} className="cl-btn cl-btn--secondary cl-btn--sm cl-nav__cta">
            <AccountIcon size={16} strokeWidth={2} aria-hidden />
            <span>{account.label}</span>
          </Link>
        </div>

        <button
          type="button"
          className="cl-iconbtn cl-iconbtn--bare cl-nav__burger"
          aria-label={open ? "Zavřít menu" : "Otevřít menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="cl-nav__drawer">
          {LINKS.map((link) => renderLink(link, true))}
          <Link
            href={account.href}
            className="cl-btn cl-btn--secondary cl-btn--block"
            style={{ marginTop: "var(--sp-4)" }}
            onClick={() => setOpen(false)}
          >
            <AccountIcon size={18} strokeWidth={2} aria-hidden />
            <span>{account.label}</span>
          </Link>
        </div>
      )}
    </header>
  );
}
