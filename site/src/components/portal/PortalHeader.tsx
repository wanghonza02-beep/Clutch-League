import type { ReactNode } from "react";

/**
 * Hlavička stránky portálu: nadtitulek, nadpis, podnadpis — na všech stránkách
 * stejně a na stejném místě. `over` může být i štítky (stav turnaje).
 */
export default function PortalHeader({
  over,
  title,
  sub,
}: {
  over?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <header className="cl-sectionhead">
      {over !== undefined &&
        (typeof over === "string" ? <span className="cl-sectionhead__over">{over}</span> : over)}
      <h1 className="portal-title">{title}</h1>
      {sub && <p className="cl-sectionhead__sub">{sub}</p>}
    </header>
  );
}
