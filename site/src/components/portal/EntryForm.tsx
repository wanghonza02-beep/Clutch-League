"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import { spaydPayment } from "@/lib/spayd";

// Interaktivní kousky kroku „Platba startovného a podmínky účasti“ v přihlášce
// týmu. Texty (podmínky, pokyny k platbě) vykresluje server (EntryPaymentStep),
// tyhle komponenty si z formuláře berou jen stav: chyby a hodnoty po
// neúspěšném odeslání a název týmu pro zprávu pro příjemce v QR platbě.

type EntryFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  /** Název týmu — zpráva pro příjemce platby. */
  teamName: string;
};

const EntryFormContext = createContext<EntryFormState>({ errors: {}, values: {}, teamName: "" });

export function EntryFormProvider({
  errors = {},
  values = {},
  teamName,
  children,
}: {
  errors?: Record<string, string>;
  values?: Record<string, string>;
  teamName: string;
  children: ReactNode;
}) {
  return <EntryFormContext.Provider value={{ errors, values, teamName }}>{children}</EntryFormContext.Provider>;
}

/** Povinné potvrzení (checkbox). Po neúspěšném odeslání zůstane zaškrtnuté. */
export function ConfirmCheck({ name, children }: { name: string; children: ReactNode }) {
  const { errors, values } = useContext(EntryFormContext);
  const error = errors[name];
  return (
    <div className="flex flex-col gap-[var(--sp-1)]">
      <label className="cl-check cl-check--top">
        <input
          type="checkbox"
          name={name}
          required
          // React formulář po akci resetuje — zaškrtnutí se vrátí z hodnot akce.
          defaultChecked={values[name] === "on"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-msg` : undefined}
        />
        <span>{children}</span>
      </label>
      {error && (
        <span id={`${name}-msg`} className="cl-field__hint cl-check__error">
          {error}
        </span>
      )}
    </div>
  );
}

/** Název týmu ze formuláře (zpráva pro příjemce). */
export function TeamNameValue() {
  return <>{useContext(EntryFormContext).teamName}</>;
}

/**
 * QR platba (SPAYD) na účet pořadatele: částka startovného a zpráva pro
 * příjemce = název týmu. Kreslí se v prohlížeči, protože název týmu nového
 * týmu je známý až z formuláře. Tlačítko uloží QR kód jako obrázek.
 */
export function PaymentQr({
  iban,
  amount,
  alt,
  saveLabel,
  fileName,
}: {
  iban: string;
  amount: number;
  alt: string;
  saveLabel: string;
  fileName: string;
}) {
  const { teamName } = useContext(EntryFormContext);
  const payload = spaydPayment({ iban, amount, message: teamName });
  const [qr, setQr] = useState<{ payload: string; svg: string; png: string } | null>(null);

  useEffect(() => {
    let alive = true;
    const options = { errorCorrectionLevel: "M", margin: 2 } as const;
    Promise.all([
      QRCode.toString(payload, { ...options, type: "svg" }),
      QRCode.toDataURL(payload, { ...options, width: 640 }),
    ])
      .then(([svg, png]) => {
        if (alive) setQr({ payload, svg, png });
      })
      .catch((error) => console.error("[QR platba]", error));
    return () => {
      alive = false;
    };
  }, [payload]);

  const ready = qr?.payload === payload;
  return (
    <div className="pay__qr">
      {/* SVG kreslí knihovna qrcode jen ze čtverců — žádný text zvenku. */}
      <div
        className="pay__qr-img"
        role="img"
        aria-label={alt}
        dangerouslySetInnerHTML={ready ? { __html: qr.svg } : undefined}
      />
      {ready && (
        <a href={qr.png} download={fileName} className="cl-btn cl-btn--ghost cl-btn--sm">
          <span>{saveLabel}</span>
        </a>
      )}
    </div>
  );
}
