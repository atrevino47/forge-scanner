'use client';

export type ResultsTab = 'overview' | 'stages' | 'roadmap';

interface ResultsBottomNavProps {
  activeTab: ResultsTab;
  onTabChange: (tab: ResultsTab) => void;
}

const TABS: Array<{ id: ResultsTab; label: string; icon: string; filledIcon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'dashboard', filledIcon: 'dashboard' },
  { id: 'stages', label: 'Stages', icon: 'architecture', filledIcon: 'architecture' },
  { id: 'roadmap', label: 'Roadmap', icon: 'analytics', filledIcon: 'analytics' },
];

export function ResultsBottomNav({ activeTab, onTabChange }: ResultsBottomNavProps) {
  return (
    <>
      {/* Separation line above nav — mobile only */}
      <div className="fixed bottom-20 left-0 w-full h-px bg-forge-accent/5 z-40 md:hidden" />
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-stretch h-20 bg-forge-glass backdrop-blur-[16px] border-t border-forge-glass-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center px-4 py-2 flex-1 transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? 'text-forge-accent border-t-4 border-forge-accent bg-forge-accent/5'
                  : 'text-forge-text opacity-40 hover:opacity-100'
              }`}
            >
              <span
                className="material-symbols-outlined mb-1"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {isActive ? tab.filledIcon : tab.icon}
              </span>
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
