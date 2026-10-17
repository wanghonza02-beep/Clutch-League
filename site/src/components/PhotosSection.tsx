import ZoomGallery from "@/components/ui/ZoomGallery";
import { GALLERY } from "@/content/gallery";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";

// Fotky z turnajů jako prostá mřížka, bez animací. Seznam fotek je v
// src/content/gallery.ts, popisky (alt) ve slovnících jazyků, část photos.alts.
// Náhled má pevný poměr stran (CSS) a načítá se líně; klik ukáže fotku
// zvětšenou v prohlížeči se šipkami (ZoomGallery).
export default async function PhotosSection() {
  const t = (await getDictionary()).photos;
  const photos = GALLERY.map(({ id, alt, width, height }) => ({
    src: `/galerie/${id}.webp`,
    thumb: `/galerie/${id}-nahled.webp`,
    width,
    height,
    alt: t.alts[alt],
    label: fmt(t.enlarge, { caption: t.alts[alt] }),
  }));

  return (
    <section id="fotky" aria-labelledby="fotky-title" className="cl-section border-t border-[var(--border-subtle)]">
      <div className="cl-container flex flex-col gap-[var(--sp-10)]">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.over}</span>
          <h2 id="fotky-title" className="cl-sectionhead__title">
            {t.title}
          </h2>
        </div>

        <ZoomGallery
          images={photos}
          label={t.galleryLabel}
          className="photos__grid"
          itemClassName="photos__item"
          unoptimized
        />
      </div>
    </section>
  );
}
