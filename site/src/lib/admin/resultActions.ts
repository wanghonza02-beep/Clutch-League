"use server";

import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/portal/paths";
import { requireRole } from "@/lib/portal/session";
import { fail, ok, text, type FormState } from "@/lib/portal/validation";
import { createClient } from "@/lib/supabase/server";
import { getMatchForResult } from "./data";
import { maxMinute, validateResult, type EventInput } from "./result";

// Zápis výsledku zápasu. Smí jen admin: tady to ověří requireRole a znovu
// databáze ve funkci admin_save_match_result (jinak vyhodí „permission denied“).

function refreshResults(matchId: string) {
  revalidatePath("/");
  revalidatePath("/turnaje");
  revalidatePath("/turnaje/[slug]", "page");
  revalidatePath(`${PATHS.portal}/vysledky`);
  revalidatePath(`${PATHS.portal}/vysledky/${matchId}`);
  revalidatePath(PATHS.portal, "layout");
}

function parseEvents(raw: string): EventInput[] | null {
  try {
    const data: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(data) || data.length > 200) return null;
    return data.map((row) => {
      const r = (typeof row === "object" && row !== null ? row : {}) as Record<string, unknown>;
      const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
      return {
        kind: str(r.kind),
        side: str(r.side),
        firstName: str(r.firstName),
        lastName: str(r.lastName),
        minute: str(r.minute),
      };
    });
  } catch {
    return null;
  }
}

function rpcFailure(message: string): FormState {
  if (message.includes("goals_do_not_match_score")) return fail("Góly nesedí se skóre.");
  if (message.includes("event_team_not_in_match")) return fail("Událost patří týmu, který zápas nehraje.");
  if (message.includes("permission denied")) return fail("Výsledky smí zapisovat jen admin.");
  if (message.includes("match_not_found")) return fail("Zápas už neexistuje.");
  console.error("[výsledky]", message);
  return fail("Výsledek se nepodařilo uložit. Zkus to prosím znovu.");
}

/**
 * Uloží (nebo s intent=clear smaže) výsledek zápasu: skóre, góly a karty.
 * Body se nikam neukládají — počítají se ze skóre.
 */
export async function saveMatchResultAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");

  const match = await getMatchForResult(text(formData, "matchId"));
  if (!match) return fail("Zápas už neexistuje.");

  if (text(formData, "intent") === "clear") return clearResult(match.id);

  const events = parseEvents(text(formData, "events"));
  if (!events) return fail("Události zápasu se nepodařilo přečíst. Obnov stránku a zkus to znovu.");

  const result = validateResult(
    { homeGoals: text(formData, "homeGoals"), awayGoals: text(formData, "awayGoals"), events },
    maxMinute(match.tournament.matchLength)
  );
  if (result.message) return fail(result.message, result.errors);

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_match_result", {
    p_match: match.id,
    p_home_goals: result.homeGoals,
    p_away_goals: result.awayGoals,
    p_events: result.events.map((e) => ({
      kind: e.kind,
      team_id: e.side === "home" ? match.home.id : match.away.id,
      first_name: e.firstName,
      last_name: e.lastName,
      minute: e.minute,
    })),
  });
  if (error) return rpcFailure(error.message);

  refreshResults(match.id);
  return ok(
    result.homeGoals === null
      ? "Výsledek je smazaný."
      : `Výsledek ${result.homeGoals}:${result.awayGoals} je uložený a je vidět v Odehraných zápasech.`
  );
}

async function clearResult(matchId: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_match_result", {
    p_match: matchId,
    p_home_goals: null,
    p_away_goals: null,
    p_events: [],
  });
  if (error) return rpcFailure(error.message);

  refreshResults(matchId);
  return ok("Výsledek je smazaný. Zápas teď čeká na zápis.");
}
