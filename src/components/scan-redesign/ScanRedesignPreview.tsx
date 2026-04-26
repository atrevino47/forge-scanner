'use client';

import { CaptureGate } from './CaptureGate';
import { ResultsDesktop } from './ResultsDesktop';
import { ResultsMobile } from './ResultsMobile';

interface ScanRedesignPreviewProps {
  view: 'capture' | 'results';
}

export function ScanRedesignPreview({ view }: ScanRedesignPreviewProps) {
  if (view === 'capture') {
    return (
      <>
        <div className="results-desktop">
          <CaptureGate />
        </div>
        <div className="results-mobile">
          <CaptureGate mobile />
        </div>
      </>
    );
  }
  return (
    <>
      <div className="results-desktop">
        <ResultsDesktop />
      </div>
      <div className="results-mobile">
        <ResultsMobile />
      </div>
    </>
  );
}
