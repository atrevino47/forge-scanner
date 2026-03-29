'use client';

interface ResultsTopBarProps {
  onBookCall: () => void;
  scannedUrl?: string;
  showUrl?: boolean;
}

export function ResultsTopBar({ onBookCall, scannedUrl, showUrl }: ResultsTopBarProps) {
  // Normalize URL for display (strip protocol + trailing slash)
  const displayUrl = scannedUrl
    ? scannedUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null;

  return (
    <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 h-14 bg-forge-glass backdrop-blur-[16px] border-b border-forge-glass-border">
      {/* Left: Book a Call */}
      <button
        onClick={onBookCall}
        className="shrink-0 px-3 py-1.5 forge-gradient-primary text-white font-mono text-[10px] font-bold tracking-widest uppercase rounded-lg shadow-lg shadow-forge-accent/20 hover:opacity-90 transition-all active:scale-[0.98]"
      >
        Book a Free Strategy Call
      </button>

      {/* Center: scanned URL (when results visible) or FORGE logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 max-w-[180px] overflow-hidden">
        {showUrl && displayUrl ? (
          <span className="font-mono text-[11px] text-forge-text-secondary truncate">
            {displayUrl}
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-forge-accent text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              precision_manufacturing
            </span>
            <span className="font-display font-black uppercase tracking-tighter text-base text-forge-accent">
              FORGE
            </span>
          </div>
        )}
      </div>

      {/* Right: placeholder for symmetry */}
      <div className="shrink-0 w-[140px]" />
    </header>
  );
}
