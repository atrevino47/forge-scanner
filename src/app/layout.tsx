import type { Metadata } from 'next';
import {
  Space_Grotesk,
  JetBrains_Mono,
  Outfit,
} from 'next/font/google';
import { GSAPProvider } from '@/components/providers/GSAPProvider';
import { CalcomProvider } from '@/components/providers/CalcomContext';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { Analytics } from '@vercel/analytics/react';
import { TopBanner } from '@/components/shared/TopBanner';
import { CalcomModal } from '@/components/shared/CalcomModal';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FORGEWITH.AI — Free AI-Powered Funnel Audit',
  description: 'Get a free AI-powered audit of your entire sales funnel. Real screenshots, annotated issues, and an optimized blueprint — in under 60 seconds.',
  openGraph: {
    title: 'FORGEWITH.AI — Free AI-Powered Funnel Audit',
    description: 'Get a free AI-powered audit of your entire sales funnel. Real screenshots, annotated issues, and an optimized blueprint — in under 60 seconds.',
    url: 'https://audit.forgedigital.com',
    siteName: 'Forge Funnel Scanner',
    type: 'website',
    images: [
      {
        url: 'https://audit.forgedigital.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Forge Funnel Scanner — AI-Powered Sales Funnel Audit',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FORGEWITH.AI — Free AI-Powered Funnel Audit',
    description: 'Get a free AI-powered audit of your entire sales funnel in under 60 seconds.',
    images: ['https://audit.forgedigital.com/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-forge-base font-body text-forge-text antialiased">
        <SupabaseProvider>
          <PostHogProvider>
            <GSAPProvider>
              <CalcomProvider>
                <TopBanner />
                <main>{children}</main>
                <CalcomModal />
              </CalcomProvider>
            </GSAPProvider>
          </PostHogProvider>
        </SupabaseProvider>
        <Analytics />
      </body>
    </html>
  );
}
