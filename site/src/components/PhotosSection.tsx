import SplitText from "@/components/ui/SplitText";
import { loadUpcoming } from "@/lib/upcoming";
import HistoryGallery, { type GalleryPhoto } from "./HistoryGallery";

const PHOTOS: GalleryPhoto[] = [
  {
    src: "/history/cup-2026-vyhlaseni-tym.jpg",
    alt: "Tým v černožlutých dresech s medailemi a trofejemi před brankou",
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
    alt: "Hráč s číslem 95 v černožlutém dresu sprintuje po umělé trávě",
    caption: "Plné tempo",
    badge: "Zápas",
  },
  {
    src: "/history/cup-2026-souboj.jpg",
    alt: "Hráč s číslem 17 a soupeř s číslem 11 se vracejí do hry u branky",
    caption: "Souboj u branky",
    badge: "Zápas",
  },
  {
    src: "/history/cup-2026-brankar.jpg",
    alt: "Brankář v oranžovém dresu a rukavicích diriguje obranu",
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
    src: "/history/cup-2026-oceneni.jpg",
    alt: "Brankář v tmavém dresu drží individuální ocenění turnaje",
    caption: "Individuální ocenění",
    badge: "Cup 2026",
  },
  {
    src: "/history/cup-2026-akce.jpg",
    alt: "Hráč s číslem 7 v bílém dresu vede míč mezi soupeři",
    caption: "Míč u nohy",
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
