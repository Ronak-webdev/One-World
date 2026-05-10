import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import {
  AudioSection,
  CapabilitiesSection,
  ConvertSection,
  CTASection,
  HeroSection,
  ImageSection,
  LabSection,
  LogoStrip,
  MetricsSection,
  WorkflowSection
} from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <LogoStrip />
        <CapabilitiesSection />
        <AudioSection />
        <ImageSection />
        <ConvertSection />
        <LabSection />
        <WorkflowSection />
        <MetricsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

