'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface ProgressIndicatorProps {
  messages: string[];
}

const MAX_VISIBLE = 5; // Keep last N messages in the stack

export function ProgressIndicator({ messages }: ProgressIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  /* Animate new messages sliding in from below */
  useEffect(() => {
    if (messages.length <= prevCountRef.current) return;
    const newCount = messages.length - prevCountRef.current;
    prevCountRef.current = messages.length;

    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll('[data-msg]');
    // Animate only newly added items (last newCount items)
    const newItems = Array.from(items).slice(-newCount);
    gsap.fromTo(
      newItems,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.1 },
    );
  }, [messages]);

  if (messages.length === 0) return null;

  const visible = messages.slice(-MAX_VISIBLE);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Forge logo pulse */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="relative">
          <span
            className="material-symbols-outlined text-forge-accent"
            style={{
              fontSize: '2.5rem',
              fontVariationSettings: "'FILL' 1",
            }}
          >
            precision_manufacturing
          </span>
          {/* GSAP-driven glow pulse is simpler via CSS keyframe here — spinner equiv */}
          <span className="absolute inset-0 rounded-full bg-forge-accent/10 animate-[ping_2s_ease-in-out_infinite]" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-forge-accent font-bold">
          Scanning in Progress
        </span>
      </div>

      {/* Message stack — newest at bottom, older fade to muted */}
      <div ref={containerRef} className="w-full max-w-sm space-y-2">
        {visible.map((msg, i) => {
          const isLatest = i === visible.length - 1;
          const ageFromEnd = visible.length - 1 - i; // 0 = latest
          // Older messages progressively more muted and smaller
          const opacity = isLatest ? 1 : Math.max(0.2, 1 - ageFromEnd * 0.2);
          const scale = isLatest ? 1 : Math.max(0.92, 1 - ageFromEnd * 0.02);
          return (
            <div
              key={`${msg}-${i}`}
              data-msg=""
              className="flex items-center gap-3"
              style={{ opacity, transform: `scale(${scale})`, transformOrigin: 'left center' }}
            >
              {isLatest ? (
                <span
                  className="material-symbols-outlined text-forge-accent shrink-0"
                  style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}
                >
                  arrow_forward
                </span>
              ) : (
                <span
                  className="material-symbols-outlined text-forge-text-muted shrink-0"
                  style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}
                >
                  check
                </span>
              )}
              <span
                className={`font-body text-sm leading-snug ${
                  isLatest ? 'text-forge-text font-medium' : 'text-forge-text-muted'
                }`}
              >
                {msg}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
