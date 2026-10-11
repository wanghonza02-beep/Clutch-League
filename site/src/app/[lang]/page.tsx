import HashScroll from "@/components/HashScroll";
import Hero from "@/components/Hero";
import PhotosSection from "@/components/PhotosSection";
import PlayedTournamentsSection from "@/components/PlayedTournamentsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";

// Odehrané turnaje a statistiky se čtou z databáze. Stránka zůstává
// statická a po 5 minutách se přegeneruje; změnu v administraci obnoví hned.
export const revalidate = 300;

// Pořadí sekcí (kotvy v navigaci):
//   kampaň (hero) → #jak-to-funguje (vlevo text, vpravo #pravidla) → #proc-clutch-league
//   → #odehrane-zapasy → #fotky
export default function Home() {
  return (
    <main>
      <Hero />
      <HowItWorksSection />
      <TestimonialsSection />
      <PlayedTournamentsSection />
      <PhotosSection />
      <HashScroll />
    </main>
  );
}
