'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Annotation } from '../../../contracts/types';
import type { ScreenshotEntry } from './types';
import { AnnotationMarker, TYPE_BG } from './AnnotationMarker';
import { cn } from '@/lib/utils';
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
      {/* Screenshot image in scrollable container */}
      <div className="relative max-h-[600px] overflow-y-auto">
        <div className="relative">
          <Image
            src={screenshot.thumbnailUrl}
            alt={`${screenshot.source} screenshot (${screenshot.viewport})`}
            width={0}
            height={0}
            sizes="100vw"
            className="w-full h-auto"
          />

          {/* Annotation dots overlaid */}
          {screenshot.annotations.map((annotation, index) => (
            <AnnotationMarker
              key={annotation.id}
              annotation={annotation}
              index={index}
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
      </div>

      {/* Annotation list below screenshot */}
      {screenshot.annotations.length > 0 && (
        <div className="border-t border-forge-border px-4 py-3 space-y-2">
          {screenshot.annotations.map((annotation, index) => (
            <button
              key={annotation.id}
              onClick={() => handleMarkerClick(annotation)}
              className="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-200 hover:bg-forge-surface"
            >
              <span className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                TYPE_BG[annotation.type]
              )}>
                {index + 1}
              </span>
              <div>
                <p className="font-body text-sm font-medium text-forge-text">{annotation.title}</p>
                <p className="font-body text-xs text-forge-text-muted line-clamp-1">{annotation.detail}</p>
              </div>
            </button>
          ))}
        </div>
      )}

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
