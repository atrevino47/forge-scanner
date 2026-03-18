'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import type { BlueprintData } from '../../../contracts/types';
import type { GenerateBlueprintResponse } from '../../../contracts/api';
import { scaleIn } from '@/lib/gsap-presets';

interface BlueprintCTAProps {
  scanId: string;
  blueprintAvailable: boolean;
  onGenerated: (blueprint: BlueprintData) => void;
}

export function BlueprintCTA({
  scanId,
  blueprintAvailable,
  onGenerated,
}: BlueprintCTAProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(blueprintAvailable);

  /* ANIMATION SEQUENCE (scroll-triggered at 80% viewport):
   * Beat 1 (0.00s): CTA card — scaleIn
   */
  useGSAP(
    () => {
      const card = scaleIn();
      gsap.fromTo(
        '[data-blueprint="card"]',
        card.from,
        {
          ...card.vars,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        },
      );
    },
    { scope: containerRef },
  );

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const res = await fetch(`/api/blueprint/generate/${scanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
      });

      if (!res.ok) throw new Error('Blueprint generation failed');

      const data = (await res.json()) as GenerateBlueprintResponse;
      setGenerated(true);
      onGenerated(data.blueprint);
    } catch {
      // TODO: error toast
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div ref={containerRef} className="py-8">
      <div
        data-blueprint="card"
        className="glass-card rounded-xl p-8 text-center"
      >
        <h3 className="font-display mb-3 text-2xl tracking-display text-forge-text">
          [COPY: blueprint CTA headline]
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-forge-text-muted">
          [COPY: blueprint CTA description]
        </p>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || generated}
          className="inline-flex items-center gap-2 rounded-lg bg-forge-accent px-8 py-3 font-body font-semibold text-forge-base transition-colors duration-200 hover:bg-forge-accent-hover disabled:opacity-50"
        >
          {isGenerating
            ? 'Generating your blueprint...'
            : generated
              ? 'Blueprint ready'
              : '[COPY: generate blueprint button]'}
          {!isGenerating && !generated && (
            <ArrowRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
