'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Annotation } from '../../../contracts/types';
import type { ScreenshotEntry } from './types';
import { AnnotationMarker } from './AnnotationMarker';
import { AnnotationPopover } from './AnnotationPopover';

interface ScreenshotCardProps {
  screenshot: ScreenshotEntry;
}

export function ScreenshotCard({ screenshot }: ScreenshotCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeAnnotation, setActiveAnnotation] =
    useState<Annotation | null>(null);

  /* ANIMATION SEQUENCE (when annotations arrive):
   * Annotation dots appear one by one with 200ms stagger,
   * scaling from 0 with a back-out bounce.
   */
  useGSAP(
    () => {
      if (screenshot.annotations.length === 0) return;

      gsap.from('[data-annotation-dot]', {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        stagger: 0.2,
        ease: 'back.out(1.7)',
      });
    },
    {
      scope: containerRef,
      dependencies: [screenshot.annotations.length],
    },
  );

  const handleMarkerClick = (annotation: Annotation) => {
    setActiveAnnotation(
      activeAnnotation?.id === annotation.id ? null : annotation,
    );
  };

  return (
    <div
      ref={containerRef}
      className="glass-card overflow-hidden rounded-xl"
    >
      {/* Screenshot image */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshot.thumbnailUrl}
          alt={`${screenshot.source} screenshot (${screenshot.viewport})`}
          className="w-full"
          loading="lazy"
        />

        {/* Annotation dots overlaid */}
        {screenshot.annotations.map((annotation) => (
          <AnnotationMarker
            key={annotation.id}
            annotation={annotation}
            isActive={activeAnnotation?.id === annotation.id}
            onClick={() => handleMarkerClick(annotation)}
          />
        ))}

        {/* Active annotation popover */}
        {activeAnnotation && (
          <AnnotationPopover
            annotation={activeAnnotation}
            onClose={() => setActiveAnnotation(null)}
          />
        )}
      </div>

      {/* Screenshot metadata bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-mono text-xs text-forge-text-muted">
          {screenshot.source} · {screenshot.viewport}
        </span>
        {screenshot.annotations.length > 0 && (
          <span className="text-xs text-forge-text-muted">
            {screenshot.annotations.length} annotations
          </span>
        )}
      </div>
    </div>
  );
}
