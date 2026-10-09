import InstagramIcon from "./InstagramIcon";

export default function ClosingCta() {
  return (
    <section
      id="registrace"
      className="relative overflow-hidden border-b border-[var(--border-subtle)]"
      style={{ background: "var(--bg-elevated)" }}
    >
      <div
        aria-hidden
        className="cl-halftone pointer-events-none absolute inset-0 opacity-50"
        style={{
          WebkitMaskImage:
            "radial-gradient(70% 90% at 50% 0%, #000, transparent 75%)",
          maskImage: "radial-gradient(70% 90% at 50% 0%, #000, transparent 75%)",
        }}
      />

      <div className="cl-container relative cl-section text-center">
        <h2
          className="cl-display mx-auto"
          style={{ fontSize: "var(--fs-h1)", fontStyle: "italic" }}
        >
          Přihlas svůj tým
        </h2>
        <p
          className="mx-auto mt-4 max-w-[46ch]"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-body-lg)",
            color: "var(--text-muted)",
          }}
        >
          Napiš nám zprávu na Instagram, potvrdíme tvůj tým a pošleme detaily k
          turnaji.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <a
            href="https://instagram.com/clutchleague_football"
            target="_blank"
            rel="noopener noreferrer"
            className="cl-btn cl-btn--primary cl-btn--lg"
          >
            <InstagramIcon size={18} />
            <span>Napsat na Instagram</span>
          </a>
          <a
            href="https://instagram.com/clutchleague_football"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-body-sm)" }}
          >
            @clutchleague_football
          </a>
        </div>
      </div>
    </section>
  );
}
