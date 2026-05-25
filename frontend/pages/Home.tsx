
import React from 'react';
import MetaMaskHero from '../components/MetaMaskHero';
import MetaMaskSpotlight from '../components/MetaMaskSpotlight';
import MetaMaskHighlights from '../components/MetaMaskHighlights';
import WhatIsStudlyf from '../components/WhatIsStudlyf';
import VoicesThatInspire from '../components/VoicesThatInspire';
import OldVsNewSection from '../components/OldVsNewSection';
import MentorCredibility from '../components/MentorCredibility';
import RoadmapSection from '../components/RoadmapSection';
import WhoWeServe from '../components/WhoWeServe';
import FeaturedInstitutions from '../components/FeaturedInstitutions';
import OurPartners from '../components/OurPartners';
import FAQ from '../components/FAQ';
import LandingNavbar from '../components/LandingNavbar';
import Footer from '../components/Footer';



const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFF8EF] text-slate-950">
      <div className="relative min-h-screen overflow-hidden pt-12 sm:pt-20">
        <LandingNavbar />
        <MetaMaskHero />
      </div>

      <MetaMaskSpotlight />

      <MetaMaskHighlights />

      {/* Scrollable content starts here */}
      <WhatIsStudlyf />
      <VoicesThatInspire />
      <OldVsNewSection />
      <MentorCredibility />
      <WhoWeServe />
      <RoadmapSection />
      <FAQ />
      <FeaturedInstitutions />
      <OurPartners />
      <Footer />
    </div>
  );
};

export default Home;
