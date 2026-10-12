import type { NextRequest } from "next/server";
import { getCaptainTeam, getOpenTournament, getTeamEntry } from "@/lib/portal/data";
import { countUnreadNotifications } from "@/lib/portal/notifications";
import { getSessionUser } from "@/lib/portal/session";

// Navigace i tlačítko „Přihlásit tým“ jsou na statických stránkách, a kdyby
// četly cookie na serveru, žádná stránka by nešla vyrenderovat staticky.
// Stav přihlášení si proto dotahují z prohlížeče tady.
//
//   GET /api/session          → { role, alerts } — alerts = nepřečtená oznámení
//                               (tečka u tlačítka účtu v navigaci)
//   GET /api/session?entry=1  → { role, alerts, entry } — stav přihlášky týmu na
//                               turnaj s otevřenými přihláškami (null = nepřihlášen)
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const body: { role: string | null; alerts: number; entry?: string | null } = {
    role: user?.role ?? null,
    alerts: user ? await countUnreadNotifications(user.id) : 0,
  };

  if (request.nextUrl.searchParams.has("entry")) {
    body.entry = null;
    if (user?.role === "captain") {
      try {
        const [team, tournament] = await Promise.all([getCaptainTeam(user.id), getOpenTournament()]);
        const entry = team && tournament ? await getTeamEntry(team.id, tournament.id) : null;
        body.entry = entry?.status ?? null;
      } catch (error) {
        console.error("[api/session] stav přihlášky se nenačetl", error);
      }
    }
  }

  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
