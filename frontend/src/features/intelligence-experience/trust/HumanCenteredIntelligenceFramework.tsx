// src/features/intelligence-experience/trust/HumanCenteredIntelligenceFramework.tsx
// Core layout establishing the baseline UX rules (progressive disclosure, high intelligence density).

import React from 'react';

export const HumanCenteredIntelligenceFramework: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 font-sans antialiased selection:bg-emerald-500/30">
      <nav className="border-b border-slate-800 bg-[#0f172a] px-6 py-4 flex items-center justify-between">
        <div className="font-semibold text-lg tracking-tight text-white flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
          DevTrack <span className="text-slate-500 font-normal">Intelligence</span>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          SYSTEM_STATE: OPERATIONAL
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Forces high-density, low-decoration layout per strict rules */}
        <div className="prose prose-invert max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
};
