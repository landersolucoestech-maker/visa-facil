import { useRef } from 'react';
import { ContactSection } from '../components/ContactSection';
import { DifferenceSection } from '../components/DifferenceSection';
import { ExperienceSection } from '../components/ExperienceSection';
import { FaqSection } from '../components/FaqSection';
import { HeroSection } from '../components/HeroSection';
import { PainPointsSection } from '../components/PainPointsSection';
import { ProcessSection } from '../components/ProcessSection';
import { PublicFooter } from '../components/PublicFooter';
import { PublicHeader } from '../components/PublicHeader';
import { ServicesSection } from '../components/ServicesSection';
import { usePublicSiteInteractions } from '../usePublicSiteInteractions';

export function PublicSitePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePublicSiteInteractions(rootRef);

  return (
    <div ref={rootRef} className="public-site">
      <PublicHeader />
      <main>
        <HeroSection />
        <ServicesSection />
        <ExperienceSection />
        <PainPointsSection />
        <ProcessSection />
        <DifferenceSection />
        <FaqSection />
        <ContactSection />
      </main>
      <PublicFooter />
    </div>
  );
}
