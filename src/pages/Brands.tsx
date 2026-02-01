/**
 * Brands Page - Página para marcas parceiras
 * Baseado no design do TeacherLists
 */

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BrandsHero } from "@/components/brands/BrandsHero";
import { BrandsStats } from "@/components/brands/BrandsStats";
import { BrandsPosition } from "@/components/brands/BrandsPosition";
import { BrandsAudiences } from "@/components/brands/BrandsAudiences";
import { BrandsOpportunities } from "@/components/brands/BrandsOpportunities";
import { BrandsLogos } from "@/components/brands/BrandsLogos";
import { BrandsContactForm } from "@/components/brands/BrandsContactForm";

export default function Brands() {
  return (
    <MainLayout>
      <BrandsHero />
      <BrandsStats />
      <BrandsPosition />
      <BrandsAudiences />
      <BrandsOpportunities />
      <BrandsLogos />
      <BrandsContactForm />
    </MainLayout>
  );
}
