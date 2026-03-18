'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function TypingIndicator() {
  const containerRef = useRef<HTMLDivElement>(null);

  /* ANIMATION SEQUENCE:
   * Ambient: Three dots — staggered scale+opacity pulse (sine wave)
   */
  useGSAP(
    () => {
      gsap.to('[data-dot]', {
        scale: 1.5,
        opacity: 0.3,
        duration: 0.5,
        stagger: { each: 0.15, repeat: -1, yoyo: true },
        ease: 'sine.inOut',
      });
    },
    { scope: containerRef },
  );

  return (
    <div className="flex justify-start px-4 py-2">
      <div
        ref={containerRef}
        className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-forge-surface px-4 py-3"
      >
        <span
          data-dot
          className="h-1.5 w-1.5 rounded-full bg-forge-text-muted"
        />
        <span
          data-dot
          className="h-1.5 w-1.5 rounded-full bg-forge-text-muted"
        />
        <span
          data-dot
          className="h-1.5 w-1.5 rounded-full bg-forge-text-muted"
        />
      </div>
    </div>
  );
}
