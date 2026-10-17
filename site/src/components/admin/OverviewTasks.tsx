import {
  AlertTriangle,
  CalendarPlus,
  ClipboardPen,
  DoorClosed,
  Flag,
  Inbox,
  UserRoundX,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Notice from "@/components/ui/Notice";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt, plural } from "@/i18n/format";
import Link from "@/i18n/Link";
import type { TournamentOverview } from "@/lib/admin/data";
import { formatDate, pragueIsoDay } from "@/lib/format";

// „Co je potřeba udělat“ v přehledu organizátora. Úkoly k turnaji jsou
// v přehledu turnaje (/portal/prehled/[turnaj]), na hlavním přehledu jen
// úkoly, které k turnaji nepatří (žádný turnaj, kapitáni bez týmu).
// Odkaz úkolu vede vždy na konkrétní místo konkrétního turnaje — na celé
// sekce (Rozpis turnajů, Přihlášky…) vede jen boční panel.

/** `link` chybí u úkolu, který se řeší v sekci z bočního panelu (bez vlastního místa). */
export type Task = {
  icon: LucideIcon;
  text: string;
  link?: { href: string; label: string };
  tone: "action" | "info";
};

/** Za kolik dní turnaj je (záporné = už proběhl), podle pražského kalendáře. */
export function daysUntil(isoDate: string): number {
  const today = Date.parse(`${pragueIsoDay(new Date().toISOString())}T00:00:00Z`);
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - today) / 86_400_000);
}

/** „dnes“, „za 3 dny“, „před 2 dny“. */
export function relativeDays(days: number, dict: Dictionary, locale: Locale): string {
  const t = dict.overview;
  if (days === 0) return t.today;
  if (days > 0) return plural(locale, days, t.inDays);
  return plural(locale, -days, t.daysAgo);
}

/** Úkoly k jednomu turnaji — seřazené od nejdůležitějšího, každé s odkazem přímo na místo. */
export function tournamentTasks(o: TournamentOverview, dict: Dictionary, locale: Locale): Task[] {
  const t = dict.overview;
  const tasks: Task[] = [];
  const { tournament, counts } = o.group;
  const days = daysUntil(tournament.startsOn);
  // Místo turnaje v Rozpisu turnajů (#udaje = formulář turnaje, #zapasy = rozpis zápasů).
  const detail = `/portal/turnaje/${tournament.id}`;
  /** Ještě neodehraný (připravuje se, přihlášky, probíhá). */
  const active = tournament.status !== "completed";
  /** Ještě nezačal. */
  const upcoming = tournament.status === "upcoming";

  if (counts.pending > 0) {
    tasks.push({
      icon: Inbox,
      text: plural(locale, counts.pending, t.taskPending),
      link: { href: `/portal/prihlasky/${tournament.id}?stav=cekajici`, label: t.taskPendingLink },
      tone: "action",
    });
  }
  if (o.matchIssues > 0) {
    tasks.push({
      icon: AlertTriangle,
      text: plural(locale, o.matchIssues, t.taskMatchIssues),
      link: { href: `${detail}#zapasy`, label: t.taskMatchIssuesLink },
      tone: "action",
    });
  }
  if (upcoming && o.rosterIssues.length > 0) {
    tasks.push({
      icon: Users,
      text: fmt(t.taskRosters, {
        teams: o.rosterIssues.map((r) => `${r.teamName} (${r.players})`).join(", "),
        min: tournament.minRoster,
        max: tournament.maxRoster,
      }),
      link: { href: `/portal/prihlasky/${tournament.id}#tym-${o.rosterIssues[0].teamId}`, label: t.taskRostersLink },
      tone: "action",
    });
  }
  if (active && days < 0) {
    tasks.push({
      icon: Flag,
      text: fmt(t.taskFinished, { name: tournament.name, date: formatDate(tournament.startsOn, locale) }),
      link: { href: `${detail}#udaje`, label: t.taskFinishedLink },
      tone: "action",
    });
  }
  if (o.resultsMissing > 0) {
    tasks.push({
      icon: ClipboardPen,
      text: plural(locale, o.resultsMissing, t.taskResults),
      link: { href: `/portal/vysledky/${tournament.id}`, label: t.taskResultsLink },
      tone: "action",
    });
  }
  if (active && !tournament.registrationOpen && counts.approved >= 2 && o.matches === 0 && days >= 0) {
    tasks.push({
      icon: CalendarPlus,
      text: t.taskSchedule,
      link: { href: `${detail}#zapasy`, label: t.taskScheduleLink },
      tone: "action",
    });
  }
  if (upcoming && !tournament.registrationOpen && days >= 0 && counts.approved + counts.pending === 0) {
    tasks.push({
      icon: DoorClosed,
      // Přepínač přihlášek je v liště téhož přehledu — odkaz by vedl na stejnou stránku.
      text: fmt(t.taskClosed, { name: tournament.name }),
      tone: "info",
    });
  }
  return tasks;
}

/** Úkoly mimo turnaje (hlavní přehled). */
export function globalTasks(
  { hasUpcoming, captainsWithoutTeam }: { hasUpcoming: boolean; captainsWithoutTeam: number },
  dict: Dictionary,
  locale: Locale
): Task[] {
  const t = dict.overview;
  const tasks: Task[] = [];
  if (!hasUpcoming) {
    tasks.push({
      icon: CalendarPlus,
      // Turnaj se zakládá v Rozpisu turnajů — tam vede boční panel, odkaz tu není.
      text: t.taskNoTournament,
      tone: "action",
    });
  }
  if (captainsWithoutTeam > 0) {
    tasks.push({
      icon: UserRoundX,
      text: plural(locale, captainsWithoutTeam, t.taskNoTeam),
      link: { href: "/portal/uzivatele?filtr=bez-tymu", label: t.taskNoTeamLink },
      tone: "info",
    });
  }
  return tasks;
}

/** Seznam úkolů; bez úkolů hláška „Všechno je vyřízené“. */
export function TaskList({ tasks, none }: { tasks: Task[]; none: string }) {
  if (tasks.length === 0) return <Notice tone="ok">{none}</Notice>;
  return (
    <ul className="tasks">
      {tasks.map((task) => (
        <li key={task.text} className={`tasks__item tasks__item--${task.tone}`}>
          <span className="tasks__icon" aria-hidden>
            <task.icon size={18} strokeWidth={2} />
          </span>
          <span className="tasks__text">{task.text}</span>
          {task.link && (
            <Link href={task.link.href} className="tasks__link">
              {task.link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
