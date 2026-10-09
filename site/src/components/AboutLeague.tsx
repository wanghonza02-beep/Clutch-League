export default function AboutLeague() {
  return (
    <section
      id="clutch-league"
      className="cl-section border-b border-[var(--border-subtle)]"
    >
      <div className="cl-container-narrow text-center">
        <div className="cl-sectionhead cl-sectionhead--center">
          <span className="cl-sectionhead__over">Clutch League</span>
          <h2 className="cl-sectionhead__title">Součást hlavní ligy</h2>
        </div>

        <p
          className="mx-auto mt-6"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-body-lg)",
            color: "var(--text-muted)",
            maxWidth: "56ch",
          }}
        >
          Přes sezónu hraješ Clutch League naostro, 7 na 7 na velkém hřišti. V zimě
          přidáváme Winter Clutch, 3 na 3 na menším hřišti, mimo ligovou tabulku.
          Stejná parta, jiné hřiště.
        </p>
      </div>
    </section>
  );
}
