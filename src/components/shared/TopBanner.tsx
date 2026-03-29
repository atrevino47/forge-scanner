'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useCalcom } from '@/components/providers/CalcomContext';

export function TopBanner() {
  const containerRef = useRef<HTMLElement>(null);
  const { openCalcom } = useCalcom();

  /* ANIMATION SEQUENCE:
   * Ambient: CTA pill underline grows on hover (CSS handles this)
   */
  useGSAP(
    () => {
      // Subtle entrance — banner slides down from -10px
      gsap.from(containerRef.current, {
        y: -10,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    },
    { scope: containerRef },
  );

  return (
    <nav
      ref={containerRef}
      className="fixed inset-x-0 top-0 z-50 flex h-[52px] items-center justify-between border-b px-8"
      style={{
        background: 'rgba(250, 250, 247, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottomColor: 'rgba(255, 107, 43, 0.08)',
      }}
    >
      {/* Left: CTA pill */}
      <button
        data-banner="cta"
        onClick={() => openCalcom({ source: 'banner_cta' })}
        className="group relative overflow-hidden rounded-full border px-4 py-1.5 font-body text-[0.6875rem] font-semibold uppercase tracking-[0.06em] transition-all duration-300"
        style={{
          color: 'var(--forge-accent)',
          borderColor: 'rgba(232, 83, 14, 0.15)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(232, 83, 14, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(232, 83, 14, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(232, 83, 14, 0.15)';
        }}
      >
        Book a Free Strategy Call
      </button>

      {/* Center: Logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span className="font-display text-[19px] font-black tracking-[-0.5px]">
          FORGEWITH<span style={{ color: 'var(--forge-accent)' }}>.AI</span>
        </span>
      </div>

      {/* Right: Scan status (shows during active scan) or empty */}
      <div className="flex items-center gap-5">
        <span className="font-mono text-[0.6875rem] text-forge-text-muted">
          {/* Populated dynamically during scan */}
        </span>
      </div>
    </nav>
  );
}
