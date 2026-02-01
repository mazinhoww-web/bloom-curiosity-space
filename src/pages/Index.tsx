import { MainLayout } from "@/components/layout/MainLayout";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowToUseSection } from "@/components/landing/HowToUseSection";
import { ShareSection } from "@/components/landing/ShareSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FinalCTA } from "@/components/landing/FinalCTA";

const Index = () => {
  return (
    <MainLayout>
      {/* 1. Hero - Empático com busca */}
      <HeroSearch />
      
      {/* 2. Benefícios para Pais */}
      <BenefitsSection />
      
      {/* 3. Como Usar - Passo a passo */}
      <HowToUseSection />
      
      {/* 4. Compartilhamento */}
      <ShareSection />
      
      {/* 5. Segurança e Transparência */}
      <TrustSection />
      
      {/* 6. CTA Final */}
      <FinalCTA />
    </MainLayout>
  );
};

export default Index;
