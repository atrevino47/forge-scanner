'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { MessageCircle, X } from 'lucide-react';

interface ChatToggleProps {
  isOpen: boolean;
  onClick: () => void;
  hasNewMessage: boolean;
}

export function ChatToggle({
  isOpen,
  onClick,
  hasNewMessage,
}: ChatToggleProps) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  /* ANIMATION SEQUENCE:
   * Beat 1 (0.00s): Button — scaleIn on mount
   */
  useGSAP(
    () => {
      gsap.fromTo(
        containerRef.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: 'back.out(1.7)',
        },
      );
    },
    { scope: containerRef },
  );

  /* ANIMATION: Badge pulse when new message arrives
   * Scale 1→1.3→1, repeats 3 times over 0.6s each
   */
  useGSAP(
    () => {
      if (!hasNewMessage || !badgeRef.current) return;
      gsap.fromTo(
        badgeRef.current,
        { scale: 1 },
        {
          scale: 1.3,
          duration: 0.3,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: 5,
        },
      );
    },
    { dependencies: [hasNewMessage] },
  );

  return (
    <button
      ref={containerRef}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-forge-border bg-forge-surface shadow-xl transition-colors duration-200 hover:border-forge-accent/30 sm:h-12 sm:w-12"
    >
      {isOpen ? (
        <X className="h-5 w-5 text-forge-text-muted" />
      ) : (
        <>
          <MessageCircle className="h-5 w-5 text-forge-accent" />
          {hasNewMessage && (
            <span
              ref={badgeRef}
              className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-forge-accent"
            />
          )}
        </>
      )}
    </button>
  );
}
