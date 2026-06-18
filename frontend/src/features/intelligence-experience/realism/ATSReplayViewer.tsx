// src/features/intelligence-experience/realism/ATSReplayViewer.tsx
// Visualizes the step-by-step extraction of sections from a raw document.

import React from 'react';

export const ATSReplayViewer: React.FC = () => {
  return (
    <div className="p-4 bg-slate-800 rounded border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Parsing Replay</h3>
      <div className="flex flex-col gap-2 font-mono text-xs">
        <div className="flex justify-between items-center p-2 bg-slate-900 rounded">
          <span className="text-emerald-400">[0ms] Document normalized</span>
          <span className="text-slate-500">100% confidence</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-slate-900 rounded">
          <span className="text-emerald-400">[12ms] Experience section identified</span>
          <span className="text-slate-500">Regex match: /Experience|Work History/i</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-amber-900/20 rounded border border-amber-900/50">
          <span className="text-amber-400">[24ms] Date format ambiguity detected</span>
          <span className="text-slate-500">Fallback to fuzzy parsing (72% confidence)</span>
        </div>
      </div>
    </div>
  );
};
