"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useT } from "@/i18n/client";

const EVENT = "cl:toast";

/**
 * Potvrzení akce, které přežije zmizení prvku, ze kterého přišlo — např.
 * karta přihlášky po zamítnutí vypadne z filtru „Čeká“, hláška ale zůstane.
 */
export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }));
}

/** Místo pro potvrzení (jednou v layoutu portálu). Samo zmizí po pár sekundách. */
export default function ActionToast() {
  const [message, setMessage] = useState<string | null>(null);
  const t = useT().common;

  useEffect(() => {
    let timer: number | undefined;
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(null), 7000);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && (
        <div className="toast">
          <CheckCircle2 size={18} strokeWidth={2} aria-hidden className="toast__icon" />
          <span className="toast__text">{message}</span>
          <button type="button" className="toast__close" onClick={() => setMessage(null)} aria-label={t.close}>
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
