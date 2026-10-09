import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "ok" | "error" | "accent";

const ICON = {
  info: Info,
  ok: CheckCircle2,
  error: AlertTriangle,
  accent: Info,
} as const;

/** Hláška nad formulářem nebo sekcí. */
export default function Notice({
  tone = "info",
  children,
  /** Chyby hlásí screen readerům assertive, zbytek polite. */
  live,
}: {
  tone?: Tone;
  children: ReactNode;
  live?: boolean;
}) {
  const Icon = ICON[tone];
  return (
    <p
      className={`cl-notice${tone === "info" ? "" : ` cl-notice--${tone}`}`}
      role={tone === "error" ? "alert" : undefined}
      aria-live={live ? (tone === "error" ? "assertive" : "polite") : undefined}
    >
      <span className="cl-notice__icon" aria-hidden>
        <Icon size={18} strokeWidth={2} />
      </span>
      <span>{children}</span>
    </p>
  );
}
