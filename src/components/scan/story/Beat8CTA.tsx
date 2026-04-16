'use client';

import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';

interface Props {
  onBook: () => void;
}

export function Beat8CTA({ onBook }: Props) {
  return (
    <section className="px-6 py-24 text-center max-w-xl mx-auto">
      <h2 className="font-display text-3xl md:text-5xl text-forge-text mb-4">
        {copy.beats.cta.headline}
      </h2>
      <p className="text-forge-text-secondary mb-8">{copy.beats.cta.body}</p>
      <button
        type="button"
        onClick={onBook}
        className="px-8 py-4 rounded-lg bg-forge-accent text-white font-semibold text-lg"
      >
        {copy.beats.cta.button}
      </button>
    </section>
  );
}
