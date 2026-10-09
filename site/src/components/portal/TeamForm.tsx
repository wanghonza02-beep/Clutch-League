"use client";

import { useActionState } from "react";
import Notice from "@/components/ui/Notice";
import TeamFields from "./TeamFields";
import { saveTeamAction } from "@/lib/portal/actions";
import { IDLE } from "@/lib/portal/validation";
import type { Team } from "@/lib/portal/types";

/** Úprava údajů už přihlášeného týmu v portálu. */
export default function TeamForm({ team }: { team: Team }) {
  const [state, action, pending] = useActionState(saveTeamAction, IDLE);

  return (
    <form action={action} className="flex flex-col gap-[var(--sp-6)]">
      {state.status !== "idle" && state.message && (
        <Notice tone={state.status === "ok" ? "ok" : "error"} live>
          {state.message}
        </Notice>
      )}

      <TeamFields team={team} errors={state.errors} values={state.values} />

      <div>
        <button
          type="submit"
          className={`cl-btn cl-btn--primary w-full sm:w-auto${pending ? " cl-btn--loading" : ""}`}
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
        >
          <span className="cl-btn-label">Uložit změny</span>
        </button>
      </div>
    </form>
  );
}
