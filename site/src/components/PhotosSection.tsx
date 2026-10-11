import ParallaxGallery, { type ParallaxPhoto } from "@/components/ui/3d-parallax-unfurling-gallery";
import SplitText from "@/components/ui/SplitText";
import { GALLERY } from "@/content/gallery";
import { getDictionary } from "@/i18n/server";

// Fotky z turnajů jako 3D galerie (ParallaxGallery). Seznam fotek je v
// src/content/gallery.ts, popisky (alt) ve slovnících jazyků, část photos.alts.
export default async function PhotosSection() {
  const t = (await getDictionary()).photos;
  const photos: ParallaxPhoto[] = GALLERY.map(({ id, alt, width, height }) => ({
    src: `/galerie/${id}.webp`,
    thumb: `/galerie/${id}-nahled.webp`,
    alt: t.alts[alt],
    width,
    height,
  }));

  return (
    <section id="fotky" aria-labelledby="fotky-title" className="photos border-t border-[var(--border-subtle)]">
      <div className="cl-container photos__head">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.over}</span>
          <SplitText
            tag="h2"
            id="fotky-title"
            className="cl-sectionhead__title"
            text={t.title}
            textAlign="left"
            splitType="words"
          />
        </div>
        <span className="cl-footer-meta">{t.hint}</span>
      </div>

      <ParallaxGallery photos={photos} label={t.galleryLabel} />
    </section>
  );
}
