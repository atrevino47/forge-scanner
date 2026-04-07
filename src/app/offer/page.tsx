import type { Metadata } from 'next';
import { OfferPage } from './OfferPage';

export const metadata: Metadata = {
  title: 'Pricing — FORGEWITH.AI | AI Sales Infrastructure for Service Businesses',
  description:
    'AI-powered sales infrastructure for service businesses doing $500K–$5M. Three tiers. You own everything we build. Starting at $2,500/mo.',
  openGraph: {
    title: 'Pricing — FORGEWITH.AI',
    description:
      'AI-powered sales infrastructure. Three tiers. You own everything we build.',
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgewith.ai'}/offer`,
  },
};

export default function Page() {
  return <OfferPage />;
}
