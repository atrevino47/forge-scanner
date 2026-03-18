'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface SocialConfirmationProps {
  platform: string;
  options: Array<{ handle: string; url: string }>;
  scanId: string;
  leadId: string | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function SocialConfirmation({
  platform,
  options,
  scanId,
  leadId,
  onConfirm,
  onDismiss,
}: SocialConfirmationProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState('');

  /* ANIMATION SEQUENCE:
   * Beat 1 (0.00s): Backdrop fade in
   * Beat 2 (0.10s): Panel — scaleIn from center
   */
  useGSAP(
    () => {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.92, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
        },
      );
    },
    { scope: panelRef },
  );

  const handleConfirm = async () => {
    if (!selected) return;

    try {
      await fetch('/api/scan/capture-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          leadId: leadId ?? '',
          email: '',
          socialConfirmation: {
            platform,
            confirmedHandle: selected,
          },
        }),
      });
    } catch {
      /* best effort */
    }

    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forge-base/80 backdrop-blur-sm">
      <div
        ref={panelRef}
        className="glass-card mx-4 w-full max-w-md rounded-xl p-6"
      >
        <h3 className="font-display mb-1 text-lg tracking-display text-forge-text">
          [COPY: social confirmation headline]
        </h3>
        <p className="mb-4 text-sm text-forge-text-muted">
          We found multiple {platform} profiles. Which one is yours?
        </p>

        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.handle}
              onClick={() => setSelected(opt.handle)}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-200 ${
                selected === opt.handle
                  ? 'border-forge-accent bg-forge-accent/10'
                  : 'border-forge-border bg-forge-surface hover:border-forge-accent/30'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selected === opt.handle
                    ? 'border-forge-accent bg-forge-accent'
                    : 'border-forge-text-muted'
                }`}
              >
                {selected === opt.handle && (
                  <span className="h-1.5 w-1.5 rounded-full bg-forge-base" />
                )}
              </span>
              <span className="font-mono text-sm text-forge-text">
                @{opt.handle}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 rounded-lg border border-forge-border py-2.5 font-body text-sm text-forge-text-muted transition-colors duration-200 hover:border-forge-accent/30"
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-1 rounded-lg bg-forge-accent py-2.5 font-body text-sm font-semibold text-forge-base transition-colors duration-200 hover:bg-forge-accent-hover disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
