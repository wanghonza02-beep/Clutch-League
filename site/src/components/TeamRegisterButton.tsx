"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PATHS } from "@/lib/portal/paths";

/**
 * „Přihlásit tým“ / „Odhlásit tým z turnaje“ podle toho, jestli má přihlášený
 * uživatel tým na turnaji s otevřenými přihláškami. Obě varianty vedou na
 * stránku přihlášky týmu — tam se nepřihlášený nejdřív přihlásí nebo založí
 * účet a pak se vrátí zpátky, a odhlášení se tam ještě potvrzuje.
 *
 * Stav se dotahuje z prohlížeče (/api/session), aby úvodní stránka zůstala
 * statická. Než odpověď dorazí, ukazuje se „Přihlásit tým“.
 */
export default function TeamRegisterButton({ className }: { className: string }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/session?entry=1", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { entry?: string | null } | null) => {
        if (alive) setEntered(Boolean(data?.entry));
      })
      .catch(() => {
        // Bez spojení zůstane výchozí „Přihlásit tým“ — stránka přihlášky si stav ověří sama.
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Link href={entered ? `${PATHS.teamRegistration}#odhlasit` : PATHS.teamRegistration} className={className}>
      <span>{entered ? "Odhlásit tým z turnaje" : "Přihlásit tým"}</span>
    </Link>
  );
}
