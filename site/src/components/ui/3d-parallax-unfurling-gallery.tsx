"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useT } from "@/i18n/client";
import { fmt } from "@/i18n/format";

/**
 * 3D galerie fotek: při scrollu se rámeček rozbalí na celou plochu a stěna
 * ze čtyř sloupců fotek se natočí k divákovi. Po dojetí animace se sloupce
 * pomalu posouvají samy (1. a 3. nahoru, 2. a 4. dolů); najetí myší nebo
 * otevřená fotka posun pozastaví, scroll zpátky ho vrátí do výchozí polohy.
 *
 * Plynulost: animuje se jen transform (scale, rotace, posun) a clip-path
 * rámečku, nic, co by přepočítávalo layout. Scroll sleduje okno stránky.
 * Při „omezit pohyb“ v systému se místo 3D ukáže obyčejná mřížka fotek.
 */

export type ParallaxPhoto = {
  src: string;
  thumb: string;
  alt: string;
  width: number;
  height: number;
};

const COLUMNS = 4;
/** Kopie fotek pod sebou v každém sloupci — smyčka posunu nikdy neukáže prázdné místo. */
const COPIES = 4;
/** Rychlost samotného posunu sloupců (px za sekundu). */
const DRIFT_SPEED = 32;
/** Od jakého průběhu scrollu (0–1) se sloupce posouvají samy. */
const AUTO_FROM = 0.995;

/** Pohyb sloupců při scrollu v násobcích výšky jedné sady fotek; dir = směr samotného posunu. */
const COLUMN_PATHS: { from: number; to: number; dir: 1 | -1 }[] = [
  { from: 0, to: -0.8, dir: -1 },
  { from: -0.8, to: 0.2, dir: 1 },
  { from: 0, to: -0.8, dir: -1 },
  { from: -0.6, to: 0.4, dir: 1 },
];

type DriftMode = "run" | "hold" | "reset";

/** Posun do rozsahu [-period/2, period/2) — vizuálně stejné místo díky opakování fotek. */
const wrap = (value: number, period: number) => ((((value + period / 2) % period) + period) % period) - period / 2;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
/** Na serveru a při hydrataci se počítá s pohybem; skutečné nastavení se načte hned potom. */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  );
}

/* -------------------------------------------------------------------------- */
/*  Karta a sloupec                                                           */
/* -------------------------------------------------------------------------- */

type CardItem = { photo: ParallaxPhoto; index: number; copy: number };

type OpenPhoto = (index: number, opener: HTMLElement) => void;

function Card({ item, label, onOpen }: { item: CardItem; label: string; onOpen: OpenPhoto }) {
  // Opakované kopie jsou jen ozdoba: čtečka i Tab vidí každou fotku jednou.
  const duplicate = item.copy > 0;
  return (
    <button
      type="button"
      className="pgal__card"
      onClick={(e) => onOpen(item.index, e.currentTarget)}
      aria-label={duplicate ? undefined : label}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
    >
      <Image src={item.photo.thumb} alt="" fill unoptimized sizes="25vw" draggable={false} />
    </button>
  );
}

function Column({
  items,
  path,
  progress,
  mode,
  cardLabel,
  onOpen,
}: {
  items: CardItem[];
  path: (typeof COLUMN_PATHS)[number];
  progress: MotionValue<number>;
  mode: DriftMode;
  cardLabel: (alt: string) => string;
  onOpen: OpenPhoto;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Výška jedné sady fotek (včetně mezery) — perioda smyčky posunu.
  const period = useMotionValue(0);
  const drift = useMotionValue(0);
  const modeRef = useRef(mode);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
      period.set((el.scrollHeight + gap) / COPIES);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [period]);

  // Samotný posun běží jen v režimu „run“; zastavení drží polohu, „reset“ ji vrátí.
  useEffect(() => {
    modeRef.current = mode;
    if (mode !== "reset") return;
    const t = period.get();
    if (t) drift.set(wrap(drift.get(), t));
    const controls = animate(drift, 0, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mode, drift, period]);

  useAnimationFrame((_, delta) => {
    if (modeRef.current !== "run") return;
    drift.set(drift.get() + (path.dir * DRIFT_SPEED * Math.min(delta, 64)) / 1000);
  });

  const base = useTransform(progress, [0.15, 1], [path.from, path.to]);
  const y = useTransform(() => {
    const t = period.get();
    return t ? base.get() * t + wrap(drift.get(), t) : 0;
  });

  return (
    <motion.div ref={ref} className="pgal__col" style={{ y }}>
      {items.map((item) => (
        <Card key={`${item.copy}-${item.index}`} item={item} label={cardLabel(item.photo.alt)} onOpen={onOpen} />
      ))}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fotka na celou obrazovku                                                  */
/* -------------------------------------------------------------------------- */

function Lightbox({
  photos,
  index,
  label,
  onStep,
  onClosed,
}: {
  photos: ParallaxPhoto[];
  index: number | null;
  label: string;
  onStep: (dir: 1 | -1) => void;
  onClosed: () => void;
}) {
  const t = useT().gallery;
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

  // Klik na tmavé pozadí (mimo fotku a tlačítka) zavře. Po swipu se nezavírá.
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

  const photo = index === null ? null : photos[index];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <dialog
      ref={dialogRef}
      className="pgal-lightbox"
      aria-label={label}
      onClose={onClosed}
      onKeyDown={onKeyDown}
      onClick={onBackdropClick}
    >
      {photo && index !== null && (
        <>
          <div
            className="pgal-lightbox__stage"
            onClick={onBackdropClick}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              unoptimized
              draggable={false}
              className="pgal-lightbox__img"
            />
          </div>

          <span className="pgal-lightbox__count cl-num" aria-live="polite">
            {pad(index + 1)} <span aria-hidden>/</span>
            <span className="sr-only">{t.of}</span> {pad(photos.length)}
          </span>

          <button type="button" className="cl-iconbtn pgal-lightbox__close" onClick={close} aria-label={t.close} autoFocus>
            <X size={22} aria-hidden />
          </button>
          <button
            type="button"
            className="pgal-lightbox__arrow pgal-lightbox__arrow--prev"
            onClick={() => onStep(-1)}
            aria-label={t.prev}
          >
            <ChevronLeft size={40} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className="pgal-lightbox__arrow pgal-lightbox__arrow--next"
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

/* -------------------------------------------------------------------------- */
/*  Galerie                                                                   */
/* -------------------------------------------------------------------------- */

export default function ParallaxGallery({ photos, label }: { photos: ParallaxPhoto[]; label: string }) {
  const t = useT().gallery;
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [autoZone, setAutoZone] = useState(false);
  const inView = useInView(stageRef, { margin: "0px 0px -10% 0px" });

  const cardLabel = useCallback((alt: string) => fmt(t.enlarge, { caption: alt }), [t.enlarge]);

  const open = useCallback((index: number, opener: HTMLElement) => {
    openerRef.current = opener;
    setOpenIndex(index);
  }, []);
  const step = useCallback(
    (dir: 1 | -1) => setOpenIndex((i) => (i === null ? i : (i + dir + photos.length) % photos.length)),
    [photos.length]
  );
  const onClosed = useCallback(() => {
    setOpenIndex(null);
    // Focus zpátky na fotku, ze které se otevíralo — bez skoku stránky.
    openerRef.current?.focus({ preventScroll: true });
  }, []);

  // Sloupce: fotky po čtyřech (1., 5., 9.… do prvního sloupce), každá sada několikrát pod sebou.
  const columns = useMemo(
    () =>
      Array.from({ length: COLUMNS }, (_, c) => {
        const own = photos.map((photo, index) => ({ photo, index })).filter(({ index }) => index % COLUMNS === c);
        return Array.from({ length: COPIES }, (_, copy) => own.map((item) => ({ ...item, copy }))).flat();
      }),
    [photos]
  );

  // Scroll okna přes dráhu animace (lepící lišta nahoře je vysoká 76 px). Sekce je
  // o kus delší než dráha: na konci scéna chvíli stojí (pauza), pak odjede.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 76px", "end end"] });
  // Pružina jen pro 3D natočení; rámeček jde přímo se scrollem, ať nic nezaostává.
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  useMotionValueEvent(scrollYProgress, "change", (v) => setAutoZone(v >= AUTO_FROM));

  const frameScale = useTransform(scrollYProgress, [0, 0.15], [0.9, 1]);
  const frameRadius = useTransform(scrollYProgress, [0, 0.15], [48, 0]);
  const frameClip = useMotionTemplate`inset(0px round ${frameRadius}px)`;
  const ringOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  const rotateY = useTransform(smooth, [0.15, 1], [-45, -8]);
  const rotateX = useTransform(smooth, [0.15, 1], [25, 4]);
  const rotateZ = useTransform(smooth, [0.15, 1], [15, 2]);
  const z = useTransform(smooth, [0.15, 1], [-800, 0]);

  // Myš nad fotkou posun pozastaví, mimo fotky (mezery, okraj) se zase rozjede.
  // Dotyk se nepočítá — na mobilu by „najetí“ zůstalo viset po klepnutí.
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    setHovered(e.target instanceof Element && e.target.closest(".pgal__card") !== null);
  };
  const onPointerLeave = () => setHovered(false);

  const lightboxOpen = openIndex !== null;
  const mode: DriftMode = !autoZone ? "reset" : hovered || lightboxOpen || !inView ? "hold" : "run";

  const lightbox = (
    <Lightbox photos={photos} index={openIndex} label={label} onStep={step} onClosed={onClosed} />
  );

  if (reduced) {
    return (
      <div className="cl-container pgal-static-wrap">
        <ul className="pgal-static" aria-label={label}>
          {photos.map((photo, index) => (
            <li key={photo.src}>
              <button
                type="button"
                className="pgal__card pgal__card--static"
                onClick={(e) => open(index, e.currentTarget)}
                aria-label={cardLabel(photo.alt)}
              >
                <Image src={photo.thumb} alt="" fill unoptimized sizes="(min-width: 768px) 25vw, 50vw" />
              </button>
            </li>
          ))}
        </ul>
        {lightbox}
      </div>
    );
  }

  return (
    <div className="pgal">
      <div ref={trackRef} className="pgal__track" aria-hidden />
      <div ref={stageRef} className="pgal__stage">
        <motion.div className="pgal__frame" style={{ scale: frameScale, clipPath: frameClip }}>
          <div className="pgal__view">
            <div className="pgal__vignette" aria-hidden />
            <motion.div
              className="pgal__plane"
              role="group"
              aria-label={label}
              style={{ rotateX, rotateY, rotateZ, z }}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
            >
              {columns.map((items, c) => (
                <Column
                  key={c}
                  items={items}
                  path={COLUMN_PATHS[c]}
                  progress={smooth}
                  mode={mode}
                  cardLabel={cardLabel}
                  onOpen={open}
                />
              ))}
            </motion.div>
          </div>
          <motion.span className="pgal__ring" style={{ opacity: ringOpacity }} aria-hidden />
        </motion.div>
      </div>
      {lightbox}
    </div>
  );
}
