'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X, Mail, Phone } from 'lucide-react';

interface CapturePromptProps {
  scanId: string;
  leadId: string | null;
  onSubmit: (leadId: string, email: string, phone?: string) => void;
  onDismiss: () => void;
}

export function CapturePrompt({
  scanId,
  leadId,
  onSubmit,
  onDismiss,
}: CapturePromptProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* ANIMATION SEQUENCE:
   * Beat 1 (0.00s): Panel — slides up from bottom with scaleIn feel
   */
  useGSAP(
    () => {
      gsap.fromTo(
        panelRef.current,
        { y: '100%', opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'power3.out',
        },
      );
    },
    { scope: panelRef },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/scan/capture-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          leadId: leadId ?? '',
          email: email.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      const data = (await res.json()) as { lead: { id: string } };
      onSubmit(data.lead.id, email.trim(), phone.trim() || undefined);
    } catch {
      setError('[COPY: capture error message]');
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    gsap.to(panelRef.current, {
      y: '100%',
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: onDismiss,
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-4">
      <div
        ref={panelRef}
        className="glass-card mx-auto max-w-lg rounded-xl p-6"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg tracking-display text-forge-text">
              [COPY: capture prompt headline]
            </h3>
            <p className="mt-1 text-sm text-forge-text-muted">
              [COPY: capture prompt description]
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-forge-text-muted transition-colors duration-200 hover:text-forge-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email (required) */}
          <div className="flex items-center gap-3 rounded-lg border border-forge-border bg-forge-surface px-3">
            <Mail className="h-4 w-4 shrink-0 text-forge-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="h-11 flex-1 bg-transparent font-body text-sm text-forge-text placeholder:text-forge-text-muted/50 focus:outline-none"
            />
          </div>

          {/* Phone (optional) */}
          <div className="flex items-center gap-3 rounded-lg border border-forge-border bg-forge-surface px-3">
            <Phone className="h-4 w-4 shrink-0 text-forge-text-muted" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="[COPY: phone placeholder with benefit]"
              className="h-11 flex-1 bg-transparent font-body text-sm text-forge-text placeholder:text-forge-text-muted/50 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-forge-critical">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-forge-accent py-3 font-body text-sm font-semibold text-forge-base transition-colors duration-200 hover:bg-forge-accent-hover disabled:opacity-50"
          >
            {isSubmitting
              ? 'Saving...'
              : '[COPY: capture submit button]'}
          </button>
        </form>
      </div>
    </div>
  );
}
