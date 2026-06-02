// src/features/intelligence-experience/realism/ATSKeywordHeatmap.tsx
// Highlights exactly which keywords the ATS parser successfully locked onto.

import React from 'react';

export const ATSKeywordHeatmap: React.FC<{ text: string }> = ({ text: _text }) => {
  // Simplified for scaffolding
  return (
    <div className="p-4 bg-slate-800 rounded border border-slate-700 mt-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Keyword Heatmap</h3>
      <p className="text-sm leading-relaxed text-slate-300">
        Engineered a highly concurrent <span className="bg-emerald-500/20 text-emerald-300 px-1 rounded">distributed system</span> using <span className="bg-emerald-500/20 text-emerald-300 px-1 rounded">Go</span> and <span className="bg-emerald-500/20 text-emerald-300 px-1 rounded">Kubernetes</span>, improving <span className="bg-blue-500/20 text-blue-300 px-1 rounded">throughput</span> by 40%.
      </p>
    </div>
  );
};
