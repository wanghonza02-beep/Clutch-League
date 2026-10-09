import Image from "next/image";
import SectionLink from "@/components/SectionLink";
import TeamRegisterButton from "@/components/TeamRegisterButton";

const SRC = "/images/kampan-landscape.jpg";

export default function Hero() {
  return (
    <section id="turnaj" className="hero-stage relative overflow-hidden">
      <h1 className="sr-only">Winter Clutch, zimní 3 na 3 turnaj Clutch League, 10. 1. 2027</h1>

      {/* Blurred copy fills whatever space the uncropped artwork leaves free. */}
      <Image
        src={SRC}
        alt=""
        aria-hidden
        fill
        unoptimized
        className="scale-110 object-cover blur-2xl brightness-50"
      />
      <Image
        src={SRC}
        alt="Winter Clutch, zimní 3 na 3 turnaj Clutch League, 10. 1. 2027"
        fill
        priority
        unoptimized
        className="object-contain object-center"
      />

      <div className="absolute inset-x-[var(--gutter)] bottom-6 flex flex-col gap-3 md:left-auto md:bottom-8">
        <span className="cl-glow-wrap w-full">
          <TeamRegisterButton className="cl-btn cl-btn--primary cl-btn--lg w-full" />
        </span>
        <SectionLink section="jak-to-funguje" className="cl-btn cl-btn--secondary cl-btn--lg w-full">
          <span>Více informací</span>
        </SectionLink>
      </div>
    </section>
  );
}
