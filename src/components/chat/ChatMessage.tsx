'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';
import { DataCard } from './DataCard';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    type?: string;
    screenshotId?: string;
    calcomUrl?: string;
  };
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  metadata,
  isStreaming,
}: ChatMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* ANIMATION SEQUENCE:
   * Beat 1 (0.00s): Message bubble — fadeSlideUp
   */
  useGSAP(
    () => {
      if (isStreaming) return; // Don't animate streaming messages
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
      );
    },
    { scope: containerRef },
  );

  const isUser = role === 'user';

  // Render data card for screenshot references
  if (metadata?.type === 'data_card' && metadata.screenshotId) {
    return (
      <div ref={containerRef} className="px-4 py-1">
        <DataCard screenshotId={metadata.screenshotId} />
      </div>
    );
  }

  // Render booking CTA for calcom_embed
  if (metadata?.type === 'calcom_embed' && metadata.calcomUrl) {
    return (
      <div ref={containerRef} className="px-4 py-1">
        <DataCard calcomUrl={metadata.calcomUrl} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex px-4 py-1',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 transition-opacity duration-300',
          isUser
            ? 'rounded-br-sm bg-forge-accent/15 text-forge-text'
            : 'rounded-bl-sm bg-forge-surface text-forge-text',
          isStreaming && 'opacity-85',
        )}
      >
        <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">
          {content}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-3 w-0.5 bg-forge-accent" style={{ animation: 'blink 1s steps(1) infinite' }} />
          )}
        </p>
      </div>
    </div>
  );
}
