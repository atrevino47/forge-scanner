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
  title: 'FORGEWITH.AI — AI-Powered Funnel Scanner',
  description: 'Get a free AI-powered audit of your entire sales funnel. We capture real screenshots, annotate issues, and generate an optimized blueprint — in under 60 seconds.',
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
      </body>
    </html>
  );
}
