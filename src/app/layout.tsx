import type { Metadata } from 'next';
import {
  Instrument_Serif,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from 'next/font/google';
import { GSAPProvider } from '@/components/providers/GSAPProvider';
import { CalcomProvider } from '@/components/providers/CalcomContext';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { TopBanner } from '@/components/shared/TopBanner';
import { CalcomModal } from '@/components/shared/CalcomModal';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Forge Funnel Scanner — AI-Powered Funnel Audit',
  description: '[COPY: meta description for SEO]',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${instrumentSerif.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
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
