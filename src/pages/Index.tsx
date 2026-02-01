import { MainLayout } from "@/components/layout/MainLayout";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ForParentsSection } from "@/components/landing/ForParentsSection";
import { ForSchoolsSection } from "@/components/landing/ForSchoolsSection";
import { ForPartnersSection } from "@/components/landing/ForPartnersSection";
import { ValueProposition } from "@/components/landing/ValueProposition";
import { FinalCTA } from "@/components/landing/FinalCTA";

const Index = () => {
  return (
    <MainLayout>
      {/* 1. Hero with Search */}
      <HeroSearch />
      
      {/* 2. How It Works */}
      <HowItWorksSection />
      
      {/* 3. For Parents */}
      <ForParentsSection />
      
      {/* 4. For Schools */}
      <ForSchoolsSection />
      
      {/* 5. For Partners */}
      <ForPartnersSection />
      
      {/* 6. Value Proposition */}
      <ValueProposition />
      
      {/* 7. Final CTA */}
      <FinalCTA />
    </MainLayout>
  );
};

export default Index;
