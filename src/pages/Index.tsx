import { MainLayout } from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedSchools } from "@/components/home/FeaturedSchools";

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <HowItWorks />
      <FeaturedSchools />
    </MainLayout>
  );
};

export default Index;
