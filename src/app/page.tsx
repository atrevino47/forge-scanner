import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FooterSection } from '@/components/landing/FooterSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <TrustSection />
      <FAQSection />
      <FooterSection />
    </>
  );
}
