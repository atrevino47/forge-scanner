'use client';

import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';

interface Props {
  messages: string[];
}

export function ScanProgressBeat({ messages }: Props) {
  const tail = messages.slice(-5);
  const latest = tail[tail.length - 1] ?? 'Connecting…';

  return (
    <section className="px-6 py-16 md:py-24 max-w-2xl mx-auto text-center">
      <h1 className="font-display text-3xl md:text-5xl text-forge-text mb-4">
        {copy.scan.inProgressHeadline}
      </h1>
      <p className="text-forge-text-secondary text-base md:text-lg mb-8">
        {copy.scan.inProgressBody}
      </p>
      <ul className="text-left space-y-2 font-mono text-xs text-forge-text-muted">
        {tail.map((m, i) => (
          <li
            key={`${i}-${m}`}
            className={i === tail.length - 1 ? 'text-forge-text' : ''}
          >
            {m}
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {latest}
      </p>
    </section>
  );
}
