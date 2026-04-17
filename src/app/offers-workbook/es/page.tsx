import type { Metadata } from 'next';
import { OffersWorkbookES } from './OffersWorkbookES';

export const metadata: Metadata = {
  title: 'Workbook de Oferta — FORGEWITH.AI',
  description:
    'Construye una oferta tan buena que decir no se sienta tonto. Un workbook guiado por forgewith.ai.',
  openGraph: {
    title: 'Workbook de Oferta — FORGEWITH.AI',
    description: 'Construye una oferta tan buena que decir no se sienta tonto.',
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgewith.ai'}/offers-workbook/es`,
  },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OffersWorkbookES />;
}
