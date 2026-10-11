"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { LogIn, Menu, ShieldCheck, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SectionLink from "@/components/SectionLink";
import { REVIEWS } from "@/content/reviews";
import { useHomePath, useT } from "@/i18n/client";
import { splitLocale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { recordPath } from "@/lib/navHistory";
import { PATHS } from "@/lib/portal/paths";
import type { Role } from "@/lib/portal/types";
import { scrollToTop } from "@/lib/sectionScroll";

type NavLink = {
  key: "rules" | "whyUs" | "played" | "photos" | "contact";
  /** Sekce úvodní stránky (id), nebo… */
  section?: string;
  /** …samostatná stránka. */
  href?: string;
  /** Cesty, na kterých je odkaz zvýrazněný (podstránky). */
  match?: string[];
};

// Pořadí odpovídá sekcím na úvodní stránce. „Pravidla“ vedou na sekci
// „Jak to funguje“ (text vlevo, pravidla vpravo) — samostatný odkaz na ni není.
const LINKS: NavLink[] = [
  { key: "rules", section: "pravidla" },
  // Sekce s recenzemi se bez nich neukazuje, tak ani odkaz na ni.
  ...(REVIEWS.length > 0 ? [{ key: "whyUs" as const, section: "proc-clutch-league" }] : []),
  { key: "played", section: "odehrane-zapasy", match: ["/turnaje"] },
  { key: "photos", section: "fotky" },
  { key: "contact", href: "/kontakt", match: ["/kontakt"] },
];

type Account = { href: string; label: "login" | "myTeam" | "admin"; icon: LucideIcon };

// Přihlásit se může kdokoli s účtem (kapitán, admin).
// Přihlášenému ukáže rovnou cestu do jeho části portálu.
const ACCOUNT: Record<"guest" | Role, Account> = {
  guest: { href: PATHS.login, label: "login", icon: LogIn },
  captain: { href: PATHS.portal, label: "myTeam", icon: Users },
  admin: { href: PATHS.portal, label: "admin", icon: ShieldCheck },
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
  const t = useT();
  const home = useHomePath();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Cesta bez jazykové předpony — zvýraznění odkazů je stejné ve všech jazycích.
  const { path } = splitLocale(pathname);
  const role = useSessionRole(pathname);
  const account = ACCOUNT[role ?? "guest"];
  const AccountIcon = account.icon;

  useEffect(() => recordPath(pathname), [pathname]);

  const linkClass = (link: NavLink) => {
    const active = (link.match ?? []).some((base) => path === base || path.startsWith(`${base}/`));
    return {
      className: `cl-nav__link${active ? " is-active" : ""}`,
      "aria-current": active ? ("page" as const) : undefined,
    };
  };

  // Logo vede vždy na úplný začátek webu. Na úvodní stránce by Next při
  // stejné adrese nescrolloval (a kotva by zůstala), proto se sjede ručně.
  const onLogoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    if (pathname !== home || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    scrollToTop(home);
  };

  const renderLink = (link: NavLink, inDrawer: boolean) =>
    link.section ? (
      <SectionLink
        key={link.key}
        section={link.section}
        {...linkClass(link)}
        onNavigate={inDrawer ? () => setOpen(false) : undefined}
      >
        {t.nav[link.key]}
      </SectionLink>
    ) : (
      <Link
        key={link.key}
        href={link.href ?? "/"}
        {...linkClass(link)}
        onClick={inDrawer ? () => setOpen(false) : undefined}
      >
        {t.nav[link.key]}
      </Link>
    );

  return (
    <header className="site-header">
      <nav className="cl-nav" aria-label={t.nav.main}>
        <Link href="/" className="cl-logo" aria-label={t.nav.logo} onClick={onLogoClick}>
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
            <span>{t.nav[account.label]}</span>
          </Link>
        </div>

        <LanguageSwitcher />

        <button
          type="button"
          className="cl-iconbtn cl-iconbtn--bare cl-nav__burger"
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
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
            <span>{t.nav[account.label]}</span>
          </Link>
        </div>
      )}
    </header>
  );
}
