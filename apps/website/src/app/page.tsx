import { AboutSection } from "@/components/sections/about-section";
import { AdmissionsSection } from "@/components/sections/admissions-section";
import { ClosingCta } from "@/components/sections/closing-cta";
import { HeroSection } from "@/components/sections/hero-section";
import { InstitutionalHighlights } from "@/components/sections/institutional-highlights";
import { WhyPoltektransSection } from "@/components/sections/why-poltektrans-section";
import { InformationBoard } from "@/components/news/information-board";
import { NewsSection } from "@/components/news/news-section";
import { ProgramsSection } from "@/components/program-study/programs-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <InstitutionalHighlights />
      <AboutSection />
      <ProgramsSection />
      <WhyPoltektransSection />
      <AdmissionsSection />
      <InformationBoard />
      <NewsSection />
      <ClosingCta />
    </>
  );
}
