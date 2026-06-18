// src/features/intelligence-experience/semantic/RankingTraceInterface.tsx
// Exposes the weights and hybrid scoring logic used in final ranking.

import React from 'react';

export const RankingTraceInterface: React.FC = () => {
  return (
    <div className="p-3 bg-slate-800 rounded border border-slate-700/50">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hybrid Rank Trace</h4>
      <div className="space-y-1 text-sm font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">Dense (Vector)</span>
          <span className="text-blue-400">0.82 * 0.7 = 0.574</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Sparse (BM25)</span>
          <span className="text-emerald-400">0.95 * 0.3 = 0.285</span>
        </div>
        <div className="flex justify-between border-t border-slate-700 mt-1 pt-1">
          <span className="text-slate-200">Final Score</span>
          <span className="text-purple-400 font-bold">0.859</span>
        </div>
      </div>
    </div>
  );
};
