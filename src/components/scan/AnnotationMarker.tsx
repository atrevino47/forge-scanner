'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
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
  const ref = useRef<HTMLButtonElement>(null);

  // GSAP pulse on mount — scale 1→1.15→1, runs twice then stops
  useGSAP(() => {
    if (ref.current && !isActive) {
      gsap.to(ref.current, {
        scale: 1.15,
        duration: 0.4,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: 3, // 2 full cycles (out+back = 1 repeat)
      });
    }
  }, { dependencies: [isActive] });

  return (
    <button
      ref={ref}
      data-annotation-dot
      onClick={onClick}
      className={cn(
        'absolute z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-forge-base text-[10px] font-bold text-forge-base',
        TYPE_BG[annotation.type],
        isActive && 'ring-2 ring-forge-text/30 ring-offset-1 ring-offset-forge-base',
      )}
      style={{
        left: `${annotation.position.x}%`,
        top: `${annotation.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      aria-label={annotation.title}
      title={annotation.title}
    >
      {index + 1}
    </button>
  );
}
