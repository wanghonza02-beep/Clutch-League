"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useT } from "@/i18n/client";

/**
 * Mřížka obrázků, které se po kliknutí ukážou zvětšené přes celou obrazovku
 * (fotky na úvodní stránce, karty na stránce /pravidla). Bez animací.
 *
 * Prohlížeč: šipky po stranách (i šipky na klávesnici a swipe) listují všemi
 * obrázky dokola. Klik mimo obrázek, křížek nebo Esc ho zavře a focus se
 * vrátí na obrázek v mřížce. Stránka pod ním se neposouvá.
 */

export type ZoomImage = {
  /** Obrázek v prohlížeči. */
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Popis tlačítka v mřížce („Zvětšit fotku: …“). */
  label: string;
  /** Náhled s pevným ořezem (fotky). Bez něj je v mřížce `src` v celém poměru stran. */
  thumb?: string;
};

function Lightbox({
  images,
  index,
  label,
  unoptimized,
  onStep,
  onClosed,
}: {
  images: ZoomImage[];
  index: number | null;
  label: string;
  unoptimized: boolean;
  onStep: (dir: 1 | -1) => void;
  onClosed: () => void;
}) {
  const t = useT().lightbox;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const isOpen = index !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  const close = () => dialogRef.current?.close();

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "ArrowRight") onStep(1);
    if (e.key === "ArrowLeft") onStep(-1);
  };

  // Klik na tmavé pozadí (mimo obrázek a tlačítka) zavře. Po swipu se nezavírá.
  const onBackdropClick = (e: MouseEvent<HTMLElement>) => {
    if (swipe.current?.moved) return;
    if (e.target === e.currentTarget) close();
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    swipe.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const start = swipe.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      start.moved = true;
      onStep(dx < 0 ? 1 : -1);
    }
  };

  const image = index === null ? null : images[index];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={label}
      onClose={onClosed}
      onKeyDown={onKeyDown}
      onClick={onBackdropClick}
    >
      {image && index !== null && (
        <>
          <div
            className="lightbox__stage"
            onClick={onBackdropClick}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <Image
              key={image.src}
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="100vw"
              unoptimized={unoptimized}
              draggable={false}
              className="lightbox__img"
            />
          </div>

          <span className="lightbox__count cl-num" aria-live="polite">
            {pad(index + 1)} <span aria-hidden>/</span>
            <span className="sr-only">{t.of}</span> {pad(images.length)}
          </span>

          <button type="button" className="cl-iconbtn lightbox__close" onClick={close} aria-label={t.close} autoFocus>
            <X size={22} aria-hidden />
          </button>
          <button
            type="button"
            className="lightbox__arrow lightbox__arrow--prev"
            onClick={() => onStep(-1)}
            aria-label={t.prev}
          >
            <ChevronLeft size={40} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className="lightbox__arrow lightbox__arrow--next"
            onClick={() => onStep(1)}
            aria-label={t.next}
          >
            <ChevronRight size={40} strokeWidth={1.75} aria-hidden />
          </button>
        </>
      )}
    </dialog>
  );
}

export default function ZoomGallery({
  images,
  label,
  className,
  itemClassName,
  sizes,
  unoptimized = false,
  eager = 0,
}: {
  images: ZoomImage[];
  /** Popis seznamu i prohlížeče pro čtečky. */
  label: string;
  /** Třída seznamu (mřížka) a tlačítka s obrázkem. */
  className: string;
  itemClassName: string;
  /** `sizes` obrázku v mřížce (jen bez náhledu `thumb`). */
  sizes?: string;
  /** Obrázky jsou už zmenšené (fotky), Next je nepřevádí. */
  unoptimized?: boolean;
  /** Kolik prvních obrázků je vidět hned po načtení (ty se nenačítají líně). */
  eager?: number;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const step = useCallback(
    (dir: 1 | -1) => setOpenIndex((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length]
  );
  const onClosed = useCallback(() => {
    setOpenIndex(null);
    // Focus zpátky na obrázek, ze kterého se otevíralo — bez skoku stránky.
    openerRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <ul className={className} aria-label={label}>
        {images.map((image, index) => (
          <li key={image.src}>
            <button
              type="button"
              className={itemClassName}
              aria-label={image.label}
              onClick={(e) => {
                openerRef.current = e.currentTarget;
                setOpenIndex(index);
              }}
            >
              {image.thumb ? (
                <Image src={image.thumb} alt="" fill unoptimized loading={index < eager ? "eager" : "lazy"} />
              ) : (
                <Image
                  src={image.src}
                  alt=""
                  width={image.width}
                  height={image.height}
                  sizes={sizes}
                  unoptimized={unoptimized}
                  loading={index < eager ? "eager" : "lazy"}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        images={images}
        index={openIndex}
        label={label}
        unoptimized={unoptimized}
        onStep={step}
        onClosed={onClosed}
      />
    </>
  );
}
