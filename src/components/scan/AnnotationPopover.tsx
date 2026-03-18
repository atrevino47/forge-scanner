'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X } from 'lucide-react';
import type { Annotation, AnnotationType } from '../../../contracts/types';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<AnnotationType, string> = {
  critical: 'Critical Issue',
  warning: 'Warning',
  opportunity: 'Opportunity',
  positive: 'Strength',
};

const TYPE_DOT: Record<AnnotationType, string> = {
  critical: 'bg-forge-critical',
  warning: 'bg-forge-warning',
  opportunity: 'bg-forge-opportunity',
  positive: 'bg-forge-positive',
};

interface AnnotationPopoverProps {
  annotation: Annotation;
  onClose: () => void;
}

export function AnnotationPopover({
  annotation,
  onClose,
}: AnnotationPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  /* ANIMATION SEQUENCE:
   * Beat 1 (0.00s): Popover — scaleIn from annotation position
   */
  useGSAP(
    () => {
      gsap.fromTo(
        popoverRef.current,
        { opacity: 0, scale: 0.9, y: 6 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.25,
          ease: 'power2.out',
        },
      );
    },
    { scope: popoverRef },
  );

  // Position popover to avoid clipping at edges
  const left =
    annotation.position.x > 60
      ? Math.max(annotation.position.x - 35, 5)
      : annotation.position.x + 2;
  const top =
    annotation.position.y > 60
      ? annotation.position.y - 28
      : annotation.position.y + 5;

  return (
    <div
      ref={popoverRef}
      className="absolute z-20 w-72 rounded-lg border border-forge-border bg-forge-surface p-4 shadow-xl"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              TYPE_DOT[annotation.type],
            )}
          />
          <span className="text-xs font-medium uppercase text-forge-text-muted">
            {TYPE_LABELS[annotation.type]}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-forge-text-muted transition-colors duration-200 hover:text-forge-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <h4 className="mt-2 font-body text-sm font-semibold text-forge-text">
        {annotation.title}
      </h4>
      <p className="mt-1 font-body text-xs leading-relaxed text-forge-text-muted">
        {annotation.detail}
      </p>
      <span className="mt-2 inline-block rounded-full bg-forge-card px-2 py-0.5 text-[10px] font-medium text-forge-text-muted">
        {annotation.category}
      </span>
    </div>
  );
}
