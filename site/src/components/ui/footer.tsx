import type { ReactNode } from "react";
import Link from "next/link";

interface FooterProps {
  logo: ReactNode;
  brandName: string;
  socialLinks: Array<{
    icon: ReactNode;
    href: string;
    label: string;
  }>;
  mainLinks: Array<{
    href: string;
    label: string;
  }>;
  legalLinks?: Array<{
    href: string;
    label: string;
  }>;
  copyright: {
    text: string;
    license?: string;
  };
}

export function Footer({
  logo,
  brandName,
  socialLinks,
  mainLinks,
  legalLinks = [],
  copyright,
}: FooterProps) {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-page)] pt-[var(--sp-16)] pb-[var(--sp-6)] lg:pt-[var(--sp-24)] lg:pb-[var(--sp-8)]">
      <div className="cl-container">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <Link href="/" className="cl-logo" aria-label={brandName}>
            {logo}
          </Link>
          <ul className="flex list-none gap-3">
            {socialLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="cl-iconbtn"
                >
                  {link.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t border-[var(--border-subtle)] pt-6 md:mt-4 md:pt-8 lg:grid lg:grid-cols-10 lg:gap-x-6">
          <nav aria-label="Patička" className="lg:col-[4/11]">
            <ul className="flex list-none flex-wrap gap-x-6 gap-y-1 lg:justify-end">
              {mainLinks.map((link) => (
                <li key={link.href} className="shrink-0">
                  <Link href={link.href} className="cl-nav__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {legalLinks.length > 0 && (
            <div className="mt-6 lg:col-[4/11] lg:mt-2">
              <ul className="flex list-none flex-wrap gap-x-6 gap-y-1 lg:justify-end">
                {legalLinks.map((link) => (
                  <li key={link.href} className="shrink-0">
                    <Link href={link.href} className="cl-footer-meta">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="cl-footer-meta mt-6 whitespace-nowrap lg:col-[1/4] lg:row-[1/3] lg:mt-0 lg:self-center">
            <div>{copyright.text}</div>
            {copyright.license && <div>{copyright.license}</div>}
          </div>
        </div>
      </div>
    </footer>
  );
}
