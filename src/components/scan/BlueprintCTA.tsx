'use client';

import { useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import type { BlueprintData } from '../../../contracts/types';
import type { GenerateBlueprintResponse } from '../../../contracts/api';
import { scaleIn } from '@/lib/gsap-presets';

const GENERATION_TIMEOUT_MS = 45_000;

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
  const [error, setError] = useState<string | null>(null);

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

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    try {
      const res = await fetch(`/api/blueprint/generate/${scanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const code = errorData?.error?.code;
        if (code === 'EMAIL_REQUIRED') {
          throw new Error('Please provide your email first to unlock the blueprint.');
        }
        throw new Error('Blueprint generation failed. Please try again.');
      }

      const data = (await res.json()) as GenerateBlueprintResponse;
      setGenerated(true);
      onGenerated(data.blueprint);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Generation timed out. The server may be busy — please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      clearTimeout(timeout);
      setIsGenerating(false);
    }
  }, [scanId, onGenerated]);

  return (
    <div ref={containerRef} className="py-8">
      <div
        data-blueprint="card"
        className="bg-forge-surface border-2 border-dashed border-forge-card rounded-xl p-8 text-center"
      >
        {error ? (
          /* Error state */
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-forge-critical/10 border border-forge-critical/20">
              <AlertTriangle className="h-6 w-6 text-forge-critical" />
            </div>
            <h3 className="font-display font-bold text-xl text-forge-text mb-2">
              Blueprint generation failed
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-forge-text-secondary font-body">
              {error}
            </p>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-lg bg-forge-accent px-8 py-3 font-body font-semibold text-white transition-colors duration-200 hover:bg-forge-accent-hover"
            >
              Try again
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        ) : (
          /* Normal state */
          <>
            <div className="w-10 h-10 mx-auto mb-4 rounded-xl bg-forge-accent/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-forge-accent" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <h3 className="font-display font-bold text-2xl text-forge-text mb-2">
              Generate Your Optimized Blueprint
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-forge-text-secondary font-body leading-relaxed">
              See what your funnel should look like — with your brand colors and a rebuilt landing page.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || generated}
              className="w-full rounded-lg bg-forge-accent py-4 font-body font-semibold text-white transition-colors duration-200 hover:bg-forge-accent-hover disabled:opacity-50 active:scale-[0.99]"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating your blueprint...
                </span>
              ) : generated ? (
                'Blueprint ready'
              ) : (
                'Generate Blueprint'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
