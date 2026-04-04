import { createServiceClient } from '@/lib/db/client';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FooterSection } from '@/components/landing/FooterSection';

async function getScanCount(): Promise<number> {
  try {
    const db = createServiceClient();
    const { count } = await db
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const scanCount = await getScanCount();

  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <TrustSection scanCount={scanCount} />
      <FAQSection />
      <FooterSection />
    </>
  );
}
