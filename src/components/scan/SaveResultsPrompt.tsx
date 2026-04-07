'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X } from 'lucide-react';
import { useAuth } from '@/components/providers/SupabaseProvider';
import { fadeSlideUp } from '@/lib/gsap-presets';

/* ANIMATION SEQUENCE:
 * Beat 1 (0.00s): Card container — fadeSlideUp (opacity 0→1, y 40→0)
 * Dismiss: fade out over 0.3s, then unmount
 */

export function SaveResultsPrompt() {
  const { user, signInWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);

  useGSAP(
    () => {
      if (dismissed || user) return;
      const preset = fadeSlideUp();
      gsap.fromTo(containerRef.current, preset.from, preset.vars);
    },
    { scope: containerRef, dependencies: [dismissed, user] },
  );

  if (user || dismissed) return null;

  const handleDismiss = () => {
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => setDismissed(true),
    });
  };

  return (
    <div
      ref={containerRef}
      className="mx-auto my-8 max-w-md rounded-xl border border-forge-glass-border bg-forge-glass p-6 text-center backdrop-blur-xl"
    >
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1 text-forge-text-muted transition-colors duration-200 hover:text-forge-text"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="font-display mb-3 text-lg tracking-display text-forge-text">
        Save your results
      </p>
      <p className="mb-4 text-sm text-forge-text-muted">
        Sign in to revisit your audit anytime — your blueprint won&apos;t disappear.
      </p>

      <button
        onClick={signInWithGoogle}
        className="inline-flex items-center gap-2 rounded-lg bg-forge-surface px-5 py-2.5 font-body text-sm font-medium text-forge-text transition-colors duration-200 hover:bg-forge-card"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <button
        onClick={handleDismiss}
        className="mt-3 block w-full text-xs text-forge-text-muted hover:text-forge-text"
      >
        No thanks, I&apos;ll lose my results
      </button>
    </div>
  );
}
