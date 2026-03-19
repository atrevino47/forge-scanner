'use client';

import type { Annotation, AnnotationType } from '../../../contracts/types';
import { cn } from '@/lib/utils';

export const TYPE_BG: Record<AnnotationType, string> = {
  critical: 'bg-forge-critical',
  warning: 'bg-forge-warning',
  opportunity: 'bg-forge-opportunity',
  positive: 'bg-forge-positive',
};

interface AnnotationMarkerProps {
  annotation: Annotation;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export function AnnotationMarker({
  annotation,
  index,
  isActive,
  onClick,
}: AnnotationMarkerProps) {
  return (
    <button
      data-annotation-dot
      onClick={onClick}
      className={cn(
        'absolute z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-forge-base text-[10px] font-bold text-forge-base',
        TYPE_BG[annotation.type],
        isActive && 'ring-2 ring-forge-text/30 ring-offset-1 ring-offset-forge-base',
        !isActive && 'animate-[pulse_2s_ease-in-out_infinite]',
      )}
      style={{
        left: `${annotation.position.x}%`,
        top: `${annotation.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      title={annotation.title}
    >
      {index + 1}
    </button>
  );
}
