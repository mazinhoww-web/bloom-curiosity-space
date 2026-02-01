import { MainLayout } from "@/components/layout/MainLayout";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowToUseSection } from "@/components/landing/HowToUseSection";
import { ShareSection } from "@/components/landing/ShareSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { PopularSchoolsSection } from "@/components/landing/PopularSchoolsSection";

const Index = () => {
  return (
    <MainLayout>
      {/* 1. Hero - Empático com busca */}
      <HeroSearch />
      
      {/* 2. Benefícios para Pais */}
      <BenefitsSection />
      
      {/* 3. Escolas Populares */}
      <PopularSchoolsSection />
      
      {/* 4. Como Usar - Passo a passo */}
      <HowToUseSection />
      
      {/* 5. Compartilhamento */}
      <ShareSection />
      
      {/* 6. Segurança e Transparência */}
      <TrustSection />
      
      {/* 7. CTA Final */}
      <FinalCTA />
    </MainLayout>
  );
};

export default Index;
