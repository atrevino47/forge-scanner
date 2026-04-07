'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useCalcom } from '@/components/providers/CalcomContext';

export function TopBanner() {
  const containerRef = useRef<HTMLElement>(null);
  const { openCalcom } = useCalcom();

  /* ANIMATION SEQUENCE:
   * Entrance: Banner slides down from -10px, opacity 0→1
   */
  useGSAP(
    () => {
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
      className="fixed inset-x-0 top-0 z-50 flex h-[56px] items-center justify-between border-b px-4 sm:px-8"
      style={{
        background: 'rgba(250, 250, 247, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottomColor: '#ECEAE4',
      }}
    >
      {/* Left: CTA — font-mono uppercase tracking-widest text-xs */}
      <button
        data-banner="cta"
        onClick={() => openCalcom({ source: 'banner_cta' })}
        className="font-mono text-xs uppercase tracking-widest transition-colors duration-200"
        style={{ color: 'var(--forge-text-secondary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--forge-accent)';
          (e.currentTarget as HTMLElement).style.textShadow = '0 0 12px rgba(232, 83, 14, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--forge-text-secondary)';
          (e.currentTarget as HTMLElement).style.textShadow = 'none';
        }}
      >
        Book a Free Strategy Call
      </button>

      {/* Center: FORGE logo — Outfit weight 900, tracking tight */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span
          className="font-display font-black tracking-tight"
          style={{ fontSize: '18px', letterSpacing: '-0.03em' }}
        >
          <span style={{ color: 'var(--forge-text)' }}>FORGE</span>
          <span style={{ color: 'var(--forge-accent)' }}>WITH.AI</span>
        </span>
      </div>

      {/* Right: Hamburger icon (decorative) */}
      <button
        className="flex flex-col items-end gap-[5px] p-1"
        aria-label="Menu"
        style={{ color: 'var(--forge-text-secondary)' }}
      >
        <span className="block h-px w-5 bg-current" />
        <span className="block h-px w-3.5 bg-current" />
        <span className="block h-px w-4 bg-current" />
      </button>
    </nav>
  );
}
