'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  messages: string[];
}

export function ProgressIndicator({ messages }: ProgressIndicatorProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef('');
  const containerRef = useRef<HTMLDivElement>(null);

  /* Animate message transitions: old text slides up + fades out,
   * new text slides up from below + fades in. */
  useEffect(() => {
    if (messages.length === 0 || !textRef.current) return;
    const latest = messages[messages.length - 1];
    if (latest === shownRef.current) return;
    shownRef.current = latest;

    const el = textRef.current;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      if (el.textContent) {
        tl.to(el, {
          opacity: 0,
          y: -8,
          duration: 0.2,
          ease: 'power2.in',
        });
      }

      tl.call(() => {
        el.textContent = latest;
      });

      tl.fromTo(
        el,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="glass-card mb-8 flex items-center gap-3 rounded-xl px-6 py-4"
    >
      <Loader2
        className="h-4 w-4 shrink-0 text-forge-accent"
        style={{ animation: 'spin 2s linear infinite' }}
      />
      <span
        ref={textRef}
        className="font-body text-sm text-forge-text-muted"
      >
        {messages[0] ?? ''}
      </span>
    </div>
  );
}
