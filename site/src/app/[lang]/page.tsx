import HashScroll from "@/components/HashScroll";
import Hero from "@/components/Hero";
import PhotosSection from "@/components/PhotosSection";
import PlayedTournamentsSection from "@/components/PlayedTournamentsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import UpcomingTournamentsSection from "@/components/UpcomingTournamentsSection";

// Turnaje (Rozpis turnajů v administraci) a statistiky se čtou z databáze.
// Stránka zůstává statická a po 5 minutách se přegeneruje; změnu
// v administraci obnoví hned.
export const revalidate = 300;

// Pořadí sekcí (kotvy v navigaci):
//   kampaň (hero, nejbližší turnaj) → #dalsi-turnaje (jen když nějaký je)
//   → #jak-to-funguje (vlevo text, vpravo tlačítko na /pravidla)
//   → #proc-clutch-league → #odehrane-zapasy → #fotky
export default function Home() {
  return (
    <main>
      <Hero />
      <UpcomingTournamentsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PlayedTournamentsSection />
      <PhotosSection />
      <HashScroll />
    </main>
  );
}
