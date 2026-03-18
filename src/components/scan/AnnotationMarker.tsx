'use client';

import type { Annotation, AnnotationType } from '../../../contracts/types';
import { cn } from '@/lib/utils';

const TYPE_BG: Record<AnnotationType, string> = {
  critical: 'bg-forge-critical',
  warning: 'bg-forge-warning',
  opportunity: 'bg-forge-opportunity',
  positive: 'bg-forge-positive',
};

interface AnnotationMarkerProps {
  annotation: Annotation;
  isActive: boolean;
  onClick: () => void;
}

export function AnnotationMarker({
  annotation,
  isActive,
  onClick,
}: AnnotationMarkerProps) {
  return (
    <button
      data-annotation-dot
      onClick={onClick}
      className={cn(
        'absolute z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-forge-base',
        TYPE_BG[annotation.type],
        isActive && 'ring-2 ring-forge-text/30 ring-offset-1 ring-offset-forge-base',
      )}
      style={{
        left: `${annotation.position.x}%`,
        top: `${annotation.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      title={annotation.title}
    >
      <span className="h-2 w-2 rounded-full bg-forge-base/60" />
    </button>
  );
}
