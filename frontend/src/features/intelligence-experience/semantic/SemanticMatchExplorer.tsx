// src/features/intelligence-experience/semantic/SemanticMatchExplorer.tsx
// Visualizes the reasoning behind a vector match between a query and an evidence node.

import React from 'react';

export const SemanticMatchExplorer: React.FC<{ query: string; matchedEvidence: string; similarity: number }> = ({
  query,
  matchedEvidence,
  similarity
}) => {
  return (
    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-sm">
      <h4 className="font-semibold text-slate-300 mb-3">Semantic Match Analysis</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">Target Role Keyword</div>
          <div className="font-mono bg-slate-800 p-2 rounded text-blue-300">{query}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Matched Evidence</div>
          <div className="font-mono bg-slate-800 p-2 rounded text-emerald-300">{matchedEvidence}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="text-xs text-slate-500">Cosine Similarity:</div>
        <div className="h-2 w-32 bg-slate-800 rounded overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${similarity * 100}%` }}></div>
        </div>
        <div className="text-xs font-mono text-slate-400">{similarity.toFixed(3)}</div>
      </div>
    </div>
  );
};
