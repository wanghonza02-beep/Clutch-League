"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type GalleryPhoto = {
  src: string;
  alt: string;
  caption: string;
  badge: string;
};

export type GalleryPlaceholder = {
  badge: string;
  title: string;
  note: string;
};

type Props = {
  label: string;
  photos: GalleryPhoto[];
  placeholders?: GalleryPlaceholder[];
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function HistoryGallery({ label, photos, placeholders = [] }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  const isOpen = index !== null;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  const open = (i: number) => setIndex(i);
  const close = () => dialogRef.current?.close();
  const step = (dir: 1 | -1) =>
    setIndex((i) => (i === null ? i : (i + dir + photos.length) % photos.length));

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  };

  // Clicks on the ::backdrop land on the <dialog> element itself.
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close();
  };

  const current = index === null ? null : photos[index];

  return (
    <>
      <div className="hist-grid-wrap">
        <ul className="hist-grid" aria-label={label}>
          {photos.map((photo, i) => (
            <li key={photo.src} className={`hist-tile${i === 0 ? " hist-tile--featured" : ""}`}>
              <button
                type="button"
                className="hist-tile__btn"
                onClick={() => open(i)}
                aria-label={`Zvětšit fotku: ${photo.caption}`}
              >
                <span className="hist-tile__frame">
                  <span className="hist-tile__in">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes={
                        i === 0
                          ? "(min-width: 860px) 600px, 100vw"
                          : "(min-width: 860px) 300px, (min-width: 640px) 33vw, 50vw"
                      }
                      className="hist-tile__img"
                    />
                    <span className="hist-tile__scrim" aria-hidden />
                    <span className="hist-tile__meta" aria-hidden>
                      <span className="cl-badge cl-badge--neutral">{photo.badge}</span>
                      <span className="hist-tile__caption">{photo.caption}</span>
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}

          {placeholders.map((ph) => (
            <li key={ph.title} className="hist-tile">
              <span className="hist-tile__frame">
                <span className="hist-tile__in hist-tile__in--empty">
                  <span className="hist-tile__raster" aria-hidden />
                  <span className="cl-badge">{ph.badge}</span>
                  <span className="hist-tile__empty-title cl-num">{ph.title}</span>
                  <span className="hist-tile__empty-note">{ph.note}</span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className="hist-lightbox"
        aria-label={label}
        onClose={() => setIndex(null)}
        onKeyDown={onKeyDown}
        onClick={onDialogClick}
      >
        {current && index !== null && (
          <>
            <div className="hist-lightbox__bar">
              <span className="hist-lightbox__count cl-num" aria-live="polite">
                {pad(index + 1)} <span aria-hidden>/</span>
                <span className="sr-only">z</span> {pad(photos.length)}
              </span>
              <button
                type="button"
                className="cl-iconbtn"
                onClick={close}
                aria-label="Zavřít galerii"
                autoFocus
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <figure className="hist-lightbox__figure">
              <div className="hist-lightbox__stage">
                <Image
                  key={current.src}
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="100vw"
                  className="hist-lightbox__img"
                />
              </div>
              <figcaption className="hist-lightbox__caption">
                <span className="cl-badge cl-badge--neutral">{current.badge}</span>
                <span>{current.caption}</span>
              </figcaption>
            </figure>

            <div className="hist-lightbox__nav">
              <button
                type="button"
                className="cl-iconbtn"
                onClick={() => step(-1)}
                aria-label="Předchozí fotka"
              >
                <ChevronLeft size={20} aria-hidden />
              </button>
              <button
                type="button"
                className="cl-iconbtn"
                onClick={() => step(1)}
                aria-label="Další fotka"
              >
                <ChevronRight size={20} aria-hidden />
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
