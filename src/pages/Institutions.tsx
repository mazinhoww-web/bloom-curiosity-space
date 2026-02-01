import { MainLayout } from "@/components/layout/MainLayout";
import { B2BHero } from "@/components/b2b/B2BHero";
import { ProblemSection } from "@/components/b2b/ProblemSection";
import { SolutionSection } from "@/components/b2b/SolutionSection";
import { GovernanceSection } from "@/components/b2b/GovernanceSection";
import { BenefitsB2BSection } from "@/components/b2b/BenefitsB2BSection";
import { B2BCTA } from "@/components/b2b/B2BCTA";

const Institutions = () => {
  return (
    <MainLayout>
      {/* 1. Hero - Institucional */}
      <B2BHero />
      
      {/* 2. O Problema */}
      <ProblemSection />
      
      {/* 3. A Solução */}
      <SolutionSection />
      
      {/* 4. Governança */}
      <GovernanceSection />
      
      {/* 5. Benefícios */}
      <BenefitsB2BSection />
      
      {/* 6. CTA Final */}
      <B2BCTA />
    </MainLayout>
  );
};

export default Institutions;
