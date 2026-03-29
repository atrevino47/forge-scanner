import type { Metadata } from 'next';
import { ScanLayout } from '@/components/scan/ScanLayout';

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
          url: 'https://audit.forgedigital.com/og-image.png',
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ScanLayout scanId={id} />;
}
