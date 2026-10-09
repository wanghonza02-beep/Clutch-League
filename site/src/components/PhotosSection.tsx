import SplitText from "@/components/ui/SplitText";
import { loadUpcoming } from "@/lib/upcoming";
import HistoryGallery, { type GalleryPhoto } from "./HistoryGallery";

// Pravidlo pro fotky: hráči našeho týmu (Žlutý balet, černožluté pruhované dresy
// a brankář v oranžovém) smějí být vidět celí, i s obličejem a jménem. Hráči
// ostatních týmů jen s číslem: bez obličeje a bez příjmení na dresu.
const PHOTOS: GalleryPhoto[] = [
  {
    src: "/history/cup-2026-vyhlaseni-tym.jpg",
    alt: "Tým Žlutý balet s medailemi a trofejí před brankou",
    caption: "Vyhlášení výsledků",
    badge: "Cup 2026",
  },
  {
    src: "/history/cup-2026-banner.jpg",
    alt: "Banner Clutch League s Clutch kostkou a šesti módy na plotě hřiště",
    caption: "Kostka rozhoduje",
    badge: "Clutch Time",
  },
  {
    src: "/history/cup-2026-sprint.jpg",
    alt: "Hráč Žlutého baletu s číslem 95 sprintuje po umělé trávě",
    caption: "Plné tempo",
    badge: "Zápas",
  },
  {
    src: "/history/cup-2026-hra.jpg",
    alt: "Hráč Žlutého baletu s číslem 13 čeká na přihrávku, v pozadí spoluhráči",
    caption: "Čeká na přihrávku",
    badge: "Zápas",
  },
  {
    src: "/history/cup-2026-brankar.jpg",
    alt: "Brankář Žlutého baletu v oranžovém dresu a rukavicích diriguje obranu",
    caption: "Brankář diriguje",
    badge: "Zápas",
  },
  {
    src: "/history/cup-2026-utok.jpg",
    alt: "Hráči v červených dresech útočí po křídle, v pozadí panelové domy",
    caption: "Útok po křídle",
    badge: "Zápas",
  },
  {
    src: "/history/cup-2026-nejlepsi-hrac.jpg",
    alt: "Hráč Žlutého baletu drží cenu pro nejlepšího hráče turnaje",
    caption: "Nejlepší hráč turnaje",
    badge: "Cup 2026",
  },
  {
    src: "/history/cup-2026-rozehravka.jpg",
    alt: "Hráč Žlutého baletu s číslem 99 sleduje míč při rozehrávce",
    caption: "Rozehrávka",
    badge: "Zápas",
  },
];

export default async function PhotosSection() {
  const upcoming = await loadUpcoming();

  return (
    <section
      id="fotky"
      aria-labelledby="fotky-title"
      className="cl-section border-t border-[var(--border-subtle)]"
    >
      <div className="cl-container">
        <div
          className="flex flex-wrap items-end justify-between gap-3"
          style={{ marginBottom: "var(--sp-10)" }}
        >
          <div className="cl-sectionhead">
            <span className="cl-sectionhead__over">Fotky</span>
            <SplitText
              tag="h2"
              id="fotky-title"
              className="cl-sectionhead__title"
              text="Cup 2026 ve fotkách"
              textAlign="left"
              splitType="words"
            />
          </div>
          <span className="cl-footer-meta">Klikni na fotku pro zvětšení</span>
        </div>

        <HistoryGallery
          label="Fotky z Clutch League Cupu 2026"
          photos={PHOTOS}
          placeholders={[
            {
              badge: upcoming.name,
              title: upcoming.dateLabel,
              note: "Fotky přibudou po turnaji",
            },
          ]}
        />
      </div>
    </section>
  );
}
