import type { Metadata } from 'next';
import { OffersWorkbook } from './OffersWorkbook';

export const metadata: Metadata = {
  title: 'Offer Workbook — FORGEWITH.AI',
  description:
    'Build a Grand Slam Offer so good saying no feels stupid. A guided workbook by forgewith.ai.',
  openGraph: {
    title: 'Offer Workbook — FORGEWITH.AI',
    description: 'Build a Grand Slam Offer so good saying no feels stupid.',
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgewith.ai'}/offers-workbook`,
  },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OffersWorkbook />;
}
