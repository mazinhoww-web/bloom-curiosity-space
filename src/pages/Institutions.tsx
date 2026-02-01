import { MainLayout } from "@/components/layout/MainLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { B2BHero } from "@/components/b2b/B2BHero";
import { ProblemSection } from "@/components/b2b/ProblemSection";
import { SolutionSection } from "@/components/b2b/SolutionSection";
import { GovernanceSection } from "@/components/b2b/GovernanceSection";
import { BenefitsB2BSection } from "@/components/b2b/BenefitsB2BSection";
import { B2BCTA } from "@/components/b2b/B2BCTA";

const Institutions = () => {
  return (
    <MainLayout>
      {/* Breadcrumbs */}
      <div className="container pt-6">
        <Breadcrumbs 
          items={[{ label: "Para Escolas" }]} 
        />
      </div>

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
