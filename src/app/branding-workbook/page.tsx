import type { Metadata } from 'next';
import { BrandingWorkbook } from './BrandingWorkbook';

export const metadata: Metadata = {
  title: 'Brand Workbook — FORGEWITH.AI',
  description:
    'Build a personal brand that compounds. A guided workbook by forgewith.ai.',
  openGraph: {
    title: 'Brand Workbook — FORGEWITH.AI',
    description: 'Build a personal brand that compounds.',
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgewith.ai'}/branding-workbook`,
  },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BrandingWorkbook />;
}
