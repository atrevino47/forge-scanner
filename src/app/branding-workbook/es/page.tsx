import type { Metadata } from 'next';
import { BrandingWorkbookES } from './BrandingWorkbookES';

export const metadata: Metadata = {
  title: 'Workbook de Marca — FORGEWITH.AI',
  description:
    'Construye una marca personal que crece con el tiempo. Un workbook guiado por forgewith.ai.',
  openGraph: {
    title: 'Workbook de Marca — FORGEWITH.AI',
    description: 'Construye una marca personal que crece con el tiempo.',
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgewith.ai'}/branding-workbook/es`,
  },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BrandingWorkbookES />;
}
