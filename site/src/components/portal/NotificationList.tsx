import { Ban, Check, CircleCheck, Inbox, LogOut, RotateCcw, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CONTACT } from "@/content/contact";
import { fmt, plural } from "@/i18n/format";
import LocaleField from "@/i18n/LocaleField";
import { getI18n } from "@/i18n/server";
import { formatDateTime } from "@/lib/format";
import { markNotificationsReadAction } from "@/lib/portal/actions";
import type { AppNotification } from "@/lib/portal/notifications";
import type { NotificationKind } from "@/lib/supabase/database.types";

const ICON: Record<NotificationKind, LucideIcon> = {
  entry_submitted: Inbox,
  entry_withdrawn: LogOut,
  entry_approved: CircleCheck,
  entry_rejected: Ban,
  entry_returned: RotateCcw,
  entry_removed: Trash2,
};

/** Barva řádku: schválení zeleně, zamítnutí červeně, ostatní neutrálně. */
const TONE: Record<NotificationKind, "ok" | "error" | "accent" | "info"> = {
  entry_submitted: "accent",
  entry_withdrawn: "info",
  entry_approved: "ok",
  entry_rejected: "error",
  entry_returned: "info",
  entry_removed: "info",
};

/** Kolik nepřečtených oznámení ukázat nahoře v přehledu kapitána — zbytek jen počtem. */
const MAX_BANNERS = 3;

/**
 * Oznámení v portálu. `variant="banners"`: nepřečtená oznámení kapitána
 * nahoře v přehledu (nejnovější tři), každé s tlačítkem „Rozumím“.
 * `variant="feed"`: poslední dění pro organizátora, nepřečtená zvýrazněná.
 * Obě mají tlačítko „Označit vše jako přečtené“, když je nepřečtených víc.
 */
export default async function NotificationList({
  items,
  variant,
  tournamentId,
}: {
  items: AppNotification[];
  variant: "banners" | "feed";
  /** Seznam jednoho turnaje — „Označit vše jako přečtené“ se týká jen jeho oznámení. */
  tournamentId?: string;
}) {
  const { locale, t: dict } = await getI18n();
  const t = dict.notifications;
  if (items.length === 0) return null;
  const unread = items.filter((n) => !n.read);
  const shown = variant === "banners" ? items.slice(0, MAX_BANNERS) : items;
  const hidden = items.length - shown.length;

  return (
    <div className={`notif notif--${variant}`}>
      <ul className="notif__list" aria-label={t.label}>
        {shown.map((n) => {
          const Icon = ICON[n.kind];
          const vars = { team: n.teamName || "—", tournament: n.tournamentName || "—" };
          return (
            <li key={n.id} className={`notif__item notif__item--${TONE[n.kind]}${n.read ? "" : " is-unread"}`}>
              <span className="notif__icon" aria-hidden>
                <Icon size={18} strokeWidth={2} />
              </span>
              <div className="notif__body">
                <p className="notif__text">
                  {!n.read && <span className="sr-only">{t.unread}: </span>}
                  {fmt(t.kinds[n.kind], vars)}
                </p>
                {n.kind === "entry_rejected" && n.note && (
                  <p className="notif__reason">{fmt(t.reason, { reason: n.note })}</p>
                )}
                {n.kind === "entry_rejected" && (
                  <p className="notif__help">{fmt(t.rejectedHelp, { email: CONTACT.email })}</p>
                )}
                <span className="notif__time cl-num">{formatDateTime(n.createdAt, locale)}</span>
              </div>
              {variant === "banners" && !n.read && (
                <form action={markNotificationsReadAction} className="notif__ack">
                  <LocaleField />
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" className="cl-btn cl-btn--ghost cl-btn--sm">
                    <Check size={14} strokeWidth={2.5} aria-hidden />
                    <span>{t.ack}</span>
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
      {(variant === "feed" ? unread.length > 0 : unread.length > 1) && (
        <form action={markNotificationsReadAction} className="notif__all">
          <LocaleField />
          {tournamentId && <input type="hidden" name="tournament" value={tournamentId} />}
          {hidden > 0 && <span className="adm-meta">{plural(locale, hidden, t.more)}</span>}
          <button type="submit" className="cl-btn cl-btn--ghost cl-btn--sm cl-btn--flush">
            <Check size={14} strokeWidth={2.5} aria-hidden />
            <span>{t.markAllRead}</span>
          </button>
        </form>
      )}
    </div>
  );
}
