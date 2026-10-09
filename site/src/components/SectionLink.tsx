"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransitionNavigate } from "@/components/PageTransition";
import { rememberSection, scrollToSection } from "@/lib/sectionScroll";

/**
 * Odkaz na sekci úvodní stránky. Na úvodní stránce plynule sjede na sekci,
 * z podstránky přejde na úvodní stránku (s přechodovou animací) a sjede tam.
 * Bez JavaScriptu i při otevření v nové záložce funguje jako obyčejný odkaz /#sekce.
 */
export default function SectionLink({
  section,
  className,
  children,
  onNavigate,
  ...rest
}: {
  section: string;
  className?: string;
  children: ReactNode;
  /** Zavolá se před posunem — např. zavření mobilního menu. */
  onNavigate?: () => void;
  "aria-current"?: "page";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navigate = useTransitionNavigate();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate?.();

    if (pathname === "/") {
      // Až po překreslení: zavírané menu nesmí ovlivnit výpočet cíle.
      requestAnimationFrame(() => scrollToSection(section));
      return;
    }
    rememberSection(section);
    navigate(() => router.push("/"));
  };

  return (
    <Link
      href={`/#${section}`}
      className={className}
      // Přechod mezi stránkami řídí onClick (PageTransition ho jinak převezme sám).
      data-transition="manual"
      onClick={onClick}
      {...rest}
    >
      {children}
    </Link>
  );
}
