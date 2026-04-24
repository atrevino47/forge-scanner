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
        className="shrink-0 px-2.5 py-1.5 forge-gradient-primary text-white font-mono text-[9px] sm:text-[10px] font-bold tracking-widest uppercase rounded-lg shadow-lg shadow-forge-accent/20 hover:opacity-90 transition-all active:scale-[0.98]"
      >
        <span className="hidden sm:inline">Book a Free Strategy Call</span>
        <span className="sm:hidden">Book a Call</span>
      </button>

      {/* Center: scanned URL (when results visible) or FORGEWITH.AI wordmark — matches TopBanner */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 max-w-[180px] md:max-w-md overflow-hidden">
        {showUrl && displayUrl ? (
          <span className="font-mono text-[11px] md:text-xs text-forge-text-secondary truncate">
            {displayUrl}
          </span>
        ) : (
          <span
            className="font-display font-black tracking-tight"
            style={{ fontSize: '18px', letterSpacing: '-0.03em' }}
          >
            <span style={{ color: 'var(--forge-text)' }}>FORGE</span>
            <span style={{ color: 'var(--forge-accent)' }}>WITH.AI</span>
          </span>
        )}
      </div>

      {/* Right: placeholder for symmetry */}
      <div className="shrink-0 w-[80px] sm:w-[140px]" />
    </header>
  );
}
