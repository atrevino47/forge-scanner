'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X, Check } from 'lucide-react';
import Cal, { getCalApi } from '@calcom/embed-react';
import { useCalcom } from '@/components/providers/CalcomContext';

export function CalcomModal() {
  const {
    isOpen,
    showConfirmation,
    prefill,
    closeCalcom,
    onBookingSuccess,
  } = useCalcom();

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  // Listen for Cal.com booking success
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    getCalApi().then((cal) => {
      if (cancelled) return;
      cal('on', {
        action: 'bookingSuccessful',
        callback: () => onBookingSuccess(),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, onBookingSuccess]);

  /* ANIMATION SEQUENCE:
   * Beat 1 (0.00s): Overlay backdrop — fade in
   * Beat 2 (0.10s): Panel — scaleIn from center
   */
  useGSAP(
    () => {
      if (!isOpen || !overlayRef.current || !panelRef.current) return;

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' },
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          delay: 0.1,
        },
      );
    },
    { dependencies: [isOpen] },
  );

  /* Booking confirmation — gold checkmark animation */
  useGSAP(
    () => {
      if (!showConfirmation || !confirmRef.current) return;

      const tl = gsap.timeline();
      tl.fromTo(
        confirmRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
      );
      tl.fromTo(
        '[data-confirm="ring"]',
        { scale: 0 },
        { scale: 1, duration: 0.5, ease: 'back.out(1.7)' },
        0,
      );
      tl.fromTo(
        '[data-confirm="check"]',
        { scale: 0 },
        { scale: 1, duration: 0.3, ease: 'power2.out' },
        0.2,
      );
      tl.fromTo(
        '[data-confirm="text"]',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4 },
        0.4,
      );
      tl.to(confirmRef.current, {
        opacity: 0,
        duration: 0.5,
        delay: 1.5,
      });
    },
    { dependencies: [showConfirmation] },
  );

  // Build calLink with pre-fill params
  const params = new URLSearchParams();
  if (prefill.name) params.set('name', prefill.name);
  if (prefill.email) params.set('email', prefill.email);
  if (prefill.phone) params.set('notes', `Phone: ${prefill.phone}`);
  const qs = params.toString();
  const calcomUrl = process.env.NEXT_PUBLIC_CALCOM_EMBED_URL ?? '';
  const calPath = calcomUrl.replace(/^https?:\/\/cal\.com\//, '');
  const calLink = `${calPath}${qs ? `?${qs}` : ''}`;

  // Booking confirmation overlay
  if (showConfirmation) {
    return (
      <div
        ref={confirmRef}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-forge-base/80 backdrop-blur-sm"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            data-confirm="ring"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-forge-accent/20 ring-4 ring-forge-accent/30"
          >
            <Check
              data-confirm="check"
              className="h-10 w-10 text-forge-accent"
            />
          </div>
          <p
            data-confirm="text"
            className="font-display text-2xl tracking-display text-forge-text"
          >
            You're booked. We'll see you on the call.
          </p>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-forge-base/85 backdrop-blur-sm"
    >
      <div
        ref={panelRef}
        className="relative mx-4 w-full max-w-2xl overflow-hidden rounded-xl border border-forge-border bg-forge-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-forge-border px-6 py-4">
          <h3 className="font-display text-lg tracking-display text-forge-text">
            Book Your Free Strategy Call
          </h3>
          <button
            onClick={closeCalcom}
            className="rounded-lg p-1 text-forge-text-muted transition-colors duration-200 hover:text-forge-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cal.com embed */}
        <div className="p-2" style={{ minHeight: 500 }}>
          <Cal
            calLink={calLink}
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              minHeight: 480,
            }}
            config={{
              layout: 'month_view',
              theme: 'dark',
              metadata: {
                source: prefill.source ?? 'banner_cta',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
