"use server";

import { formI18n } from "@/i18n/action";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { PATHS } from "@/lib/portal/paths";
import { requireRole } from "@/lib/portal/session";
import { fail, ok, text, type FormState } from "@/lib/portal/validation";
import { revalidateRoute } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { getMatchForResult } from "./data";
import { maxMinute, validateResult, type EventInput } from "./result";

// Zápis výsledku zápasu. Smí jen admin: tady to ověří requireRole a znovu
// databáze ve funkci admin_save_match_result (jinak vyhodí „permission denied“).

function refreshResults() {
  revalidateRoute("/");
  revalidateRoute("/turnaje");
  revalidateRoute("/turnaje/[slug]");
  revalidateRoute(`${PATHS.portal}/vysledky`);
  revalidateRoute(`${PATHS.portal}/vysledky/[id]`);
  revalidateRoute(PATHS.portal, "layout");
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

function rpcFailure(message: string, m: Dictionary["adminActions"]): FormState {
  if (message.includes("goals_do_not_match_score")) return fail(m.resultGoalsMismatch);
  if (message.includes("event_team_not_in_match")) return fail(m.resultWrongTeam);
  if (message.includes("permission denied")) return fail(m.resultForbidden);
  if (message.includes("match_not_found")) return fail(m.matchMissing);
  console.error("[výsledky]", message);
  return fail(m.resultFailed);
}

/**
 * Uloží (nebo s intent=clear smaže) výsledek zápasu: skóre, góly a karty.
 * Body se nikam neukládají — počítají se ze skóre.
 */
export async function saveMatchResultAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = formI18n(formData);
  const m = t.adminActions;
  await requireRole("admin", locale);

  const match = await getMatchForResult(text(formData, "matchId"));
  if (!match) return fail(m.matchMissing);

  if (text(formData, "intent") === "clear") return clearResult(match.id, m);

  const events = parseEvents(text(formData, "events"));
  if (!events) return fail(m.resultUnreadable);

  const result = validateResult(
    { homeGoals: text(formData, "homeGoals"), awayGoals: text(formData, "awayGoals"), events },
    maxMinute(match.tournament.matchLength),
    t
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
  if (error) return rpcFailure(error.message, m);

  refreshResults();
  return ok(
    result.homeGoals === null
      ? m.resultCleared
      : fmt(m.resultSaved, { score: `${result.homeGoals}:${result.awayGoals}` })
  );
}

async function clearResult(matchId: string, m: Dictionary["adminActions"]): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_match_result", {
    p_match: matchId,
    p_home_goals: null,
    p_away_goals: null,
    p_events: [],
  });
  if (error) return rpcFailure(error.message, m);

  refreshResults();
  return ok(m.resultClearedWaiting);
}
