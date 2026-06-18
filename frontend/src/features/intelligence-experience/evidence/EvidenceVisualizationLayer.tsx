// src/features/intelligence-experience/evidence/EvidenceVisualizationLayer.tsx
// Core wrapper that visualizes the "why" behind any intelligence assertion.

import React from 'react';

interface Props {
  assertion: string;
  confidenceScore: number;
  children: React.ReactNode;
}

export const EvidenceVisualizationLayer: React.FC<Props> = ({ assertion, confidenceScore, children }) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-400';
    if (score >= 0.5) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="border border-slate-700 rounded-lg bg-slate-800/50 p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-slate-200">{assertion}</h3>
        <div className={`text-sm font-semibold px-2 py-1 bg-slate-900 rounded ${getConfidenceColor(confidenceScore)}`}>
          Confidence: {(confidenceScore * 100).toFixed(0)}%
        </div>
      </div>
      <div className="pl-4 border-l-2 border-slate-700 space-y-4">
        {children}
      </div>
    </div>
  );
};
