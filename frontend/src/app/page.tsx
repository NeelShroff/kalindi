"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import KalindiHero from "@/components/KalindiHero";

// Dynamically import non-critical sections to speed up initial page load
const ProductShowcase = dynamic(() => import("@/components/sections/ProductShowcase"), { ssr: false });
const WhyKalindi = dynamic(() => import("@/components/sections/WhyKalindi"), { ssr: false });
const HealthBenefits = dynamic(() => import("@/components/sections/HealthBenefits"), { ssr: false });
const GiftCollections = dynamic(() => import("@/components/sections/GiftCollections"), { ssr: false });
const PackagingExperience = dynamic(() => import("@/components/sections/PackagingExperience"), { ssr: false });
const Testimonials = dynamic(() => import("@/components/sections/Testimonials"), { ssr: false });
const BrandStory = dynamic(() => import("@/components/sections/BrandStory"), { ssr: false });
const FAQ = dynamic(() => import("@/components/sections/FAQ"), { ssr: false });
const Footer = dynamic(() => import("@/components/sections/Footer"), { ssr: false });

export default function Home() {
  return (
    <main className="w-full overflow-x-hidden">
      <Navbar />
      <KalindiHero />
      <ProductShowcase />
      <WhyKalindi />
      <HealthBenefits />
      <GiftCollections />
      <PackagingExperience />
      <Testimonials />
      <BrandStory />
      <FAQ />
      <Footer />
    </main>
  );
}
