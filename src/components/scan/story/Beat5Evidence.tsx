'use client';

import type { FunnelStage } from '../../../../contracts/types';
import type { ScreenshotEntry, StageState } from '../types';
import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';

const ORDER: FunnelStage[] = ['traffic', 'landing', 'capture', 'offer', 'followup'];
const LABELS: Record<FunnelStage, string> = {
  traffic: 'Traffic sources',
  landing: 'Landing experience',
  capture: 'Lead capture',
  offer: 'Offer page',
  followup: 'Follow-up system',
};

interface Props {
  stages: Partial<Record<FunnelStage, StageState>>;
  screenshots: ScreenshotEntry[];
}

export function Beat5Evidence({ stages, screenshots }: Props) {
  return (
    <section className="px-6 py-20 max-w-3xl mx-auto">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-forge-text-muted mb-6">
        {copy.beats.evidence.label}
      </p>
      <div className="space-y-16">
        {ORDER.map((stage) => {
          const s = stages[stage];
          const shots = screenshots.filter((sh) => sh.stage === stage);
          if (!s && shots.length === 0) return null;
          return (
            <div key={stage}>
              <h3 className="font-display text-xl md:text-2xl text-forge-text mb-2">
                {LABELS[stage]}
              </h3>
              {s?.summary && (
                <p className="text-forge-text-secondary mb-4">
                  {s.summary.headline}
                </p>
              )}
              <div className="space-y-4">
                {shots.map((sh) => (
                  <div
                    key={sh.id}
                    className="rounded-lg overflow-hidden border border-forge-card"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sh.thumbnailUrl}
                      alt={`${stage} screenshot`}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              {s?.summary && s.summary.findings.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-forge-text-secondary list-disc pl-5">
                  {s.summary.findings.slice(0, 5).map((f) => (
                    <li key={f.id}>
                      <strong className="text-forge-text">{f.title}</strong> —{' '}
                      {f.detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
