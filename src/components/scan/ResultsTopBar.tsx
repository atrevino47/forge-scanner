'use client';

interface ResultsTopBarProps {
  onBookCall: () => void;
}

export function ResultsTopBar({ onBookCall }: ResultsTopBarProps) {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-forge-base/80 backdrop-blur-md border-b border-forge-accent/5">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-forge-accent"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          precision_manufacturing
        </span>
        <h1 className="font-display font-black uppercase tracking-tighter text-2xl text-forge-accent">
          FORGE AUDIT
        </h1>
      </div>
      <button
        onClick={onBookCall}
        className="px-4 py-1.5 forge-gradient-primary text-white font-mono text-[10px] font-bold tracking-widest uppercase rounded-lg shadow-lg shadow-forge-accent/20 hover:opacity-90 transition-all active:scale-[0.98]"
      >
        BOOK CALL
      </button>
    </header>
  );
}
