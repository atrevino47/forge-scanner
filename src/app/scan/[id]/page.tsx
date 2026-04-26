import type { Metadata } from 'next';
import { ScanLayout } from '@/components/scan/ScanLayout';
import { ScanRedesignPreview } from '@/components/scan-redesign/ScanRedesignPreview';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shortId = id.slice(0, 8);

  return {
    title: `Funnel Audit #${shortId} — FORGEWITH.AI`,
    description: 'Your AI-powered funnel audit is ready. See annotated screenshots, a health score, and an optimized blueprint for your sales funnel.',
    openGraph: {
      title: `Funnel Audit #${shortId} — FORGEWITH.AI`,
      description: 'Your AI-powered funnel audit is ready. See annotated screenshots, a health score, and an optimized blueprint.',
      type: 'website',
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgewith.ai'}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Forge Funnel Scanner Result',
        },
      ],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ redesign?: string }>;
}) {
  const { id } = await params;
  const { redesign } = await searchParams;

  // Preview-only escape hatch for design review (no live state)
  if (redesign === 'capture' || redesign === 'results') {
    return <ScanRedesignPreview view={redesign} />;
  }

  // Live scan: ScanLayout owns SSE, state machine, and renders the new
  // ScanDesktop/Mobile + CaptureGate + ResultsDesktop/Mobile based on state.
  return <ScanLayout scanId={id} />;
}
