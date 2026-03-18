'use client';

import { Calendar } from 'lucide-react';
import { useCalcom } from '@/components/providers/CalcomContext';

interface DataCardProps {
  screenshotId?: string;
  calcomUrl?: string;
}

export function DataCard({ screenshotId, calcomUrl }: DataCardProps) {
  const { openCalcom } = useCalcom();

  // Booking CTA card
  if (calcomUrl) {
    return (
      <button
        onClick={() => openCalcom()}
        className="w-full rounded-xl border border-forge-accent/20 bg-forge-accent/5 p-4 text-left transition-colors duration-200 hover:border-forge-accent/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-accent/10">
            <Calendar className="h-5 w-5 text-forge-accent" />
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-forge-text">
              [COPY: book a strategy call]
            </p>
            <p className="text-xs text-forge-text-muted">
              [COPY: book call description in chat]
            </p>
          </div>
        </div>
      </button>
    );
  }

  // Screenshot reference card
  if (screenshotId) {
    return (
      <div className="rounded-xl border border-forge-border bg-forge-surface p-3">
        <p className="text-xs text-forge-text-muted">
          Referenced screenshot: {screenshotId}
        </p>
      </div>
    );
  }

  return null;
}
