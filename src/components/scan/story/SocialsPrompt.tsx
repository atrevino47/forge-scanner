'use client';

import { useState } from 'react';
import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';

interface Props {
  scanId: string;
  leadId: string;
  onComplete: () => void;
}

export function SocialsPrompt({ scanId, leadId, onComplete }: Props) {
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const providedSocials: Record<string, string> = {};
    if (instagram.trim()) providedSocials.instagram = instagram.trim();
    if (tiktok.trim()) providedSocials.tiktok = tiktok.trim();
    if (facebook.trim()) providedSocials.facebook = facebook.trim();

    setSubmitting(true);
    try {
      if (Object.keys(providedSocials).length > 0) {
        await fetch('/api/scan/capture-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanId, leadId, providedSocials }),
        }).catch(() => {});
      }
    } finally {
      onComplete();
    }
  };

  return (
    <section className="px-6 py-12 md:py-16 max-w-xl mx-auto">
      <h2 className="font-display text-2xl md:text-3xl text-forge-text mb-2">
        {copy.scan.socialsHeadline}
      </h2>
      <p className="text-forge-text-secondary mb-6">{copy.scan.socialsBody}</p>
      <div className="space-y-3">
        <input
          className="w-full rounded-lg border border-forge-card bg-forge-base px-4 py-3 text-forge-text"
          placeholder="Instagram handle (e.g. @yourbiz)"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-forge-card bg-forge-base px-4 py-3 text-forge-text"
          placeholder="TikTok handle"
          value={tiktok}
          onChange={(e) => setTiktok(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-forge-card bg-forge-base px-4 py-3 text-forge-text"
          placeholder="Facebook page URL or handle"
          value={facebook}
          onChange={(e) => setFacebook(e.target.value)}
        />
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onComplete}
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg bg-forge-surface text-forge-text-secondary"
        >
          {copy.scan.socialsSkip}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="flex-1 px-5 py-2.5 rounded-lg bg-forge-accent text-white font-semibold"
        >
          {submitting ? 'Saving…' : copy.scan.socialsSubmit}
        </button>
      </div>
    </section>
  );
}
