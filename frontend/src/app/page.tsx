import Navbar from "@/components/Navbar";
import KalindiHero from "@/components/KalindiHero";
import ProductShowcase from "@/components/sections/ProductShowcase";
import WhyKalindi from "@/components/sections/WhyKalindi";
import HealthBenefits from "@/components/sections/HealthBenefits";
import GiftCollections from "@/components/sections/GiftCollections";
import PackagingExperience from "@/components/sections/PackagingExperience";
import Testimonials from "@/components/sections/Testimonials";
import BrandStory from "@/components/sections/BrandStory";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";

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
