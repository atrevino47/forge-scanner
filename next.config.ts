import type { NextConfig } from "next";

// Extract Supabase project hostname from env var at build time.
// Falls back to *.supabase.co wildcard if env is not set (local dev without .env.local).
function supabaseHostname(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    try {
      return new URL(url).hostname; // e.g. "abcdefghijklmnop.supabase.co"
    } catch {
      // Invalid URL — fall back to wildcard
    }
  }
  return '*.supabase.co';
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname(),
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
