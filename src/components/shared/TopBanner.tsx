'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Menu } from 'lucide-react';
import { useCalcom } from '@/components/providers/CalcomContext';

export function TopBanner() {
  const containerRef = useRef<HTMLElement>(null);
  const { openCalcom } = useCalcom();

  /* ANIMATION SEQUENCE:
   * Ambient: CTA glow — repeating boxShadow pulse (sine wave, 2s cycle)
   */
  useGSAP(
    () => {
      gsap.fromTo(
        '[data-banner="cta"]',
        { boxShadow: '0 0 0px rgba(212, 165, 55, 0)' },
        {
          boxShadow: '0 0 20px rgba(212, 165, 55, 0.15)',
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <nav
      ref={containerRef}
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-forge-border bg-forge-surface/80 px-4 backdrop-blur-xl sm:h-16 sm:px-6"
    >
      {/* Left: CTA — opens Cal.com modal */}
      <button
        data-banner="cta"
        onClick={() => openCalcom()}
        className="rounded-lg px-3 py-1.5 font-body text-xs font-semibold tracking-wide text-forge-accent uppercase sm:px-4 sm:text-sm"
      >
        [COPY: banner CTA text]
      </button>

      {/* Center: Logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span className="font-display text-xl tracking-display text-forge-text">
          FORGE<span className="text-forge-accent">.</span>
        </span>
      </div>

      {/* Right: Menu */}
      <button className="rounded-lg p-2 text-forge-text-muted transition-colors duration-200 hover:text-forge-text">
        <Menu className="h-5 w-5" />
      </button>
    </nav>
  );
}
