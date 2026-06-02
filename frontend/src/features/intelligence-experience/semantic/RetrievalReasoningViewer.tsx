// src/features/intelligence-experience/semantic/RetrievalReasoningViewer.tsx
// Shows why specific context was retrieved for generation.

import React from 'react';

export const RetrievalReasoningViewer: React.FC = () => {
  return (
    <div className="text-xs text-slate-400 border-t border-slate-700 pt-2 mt-2">
      <div className="font-semibold text-slate-300 mb-1">Retrieval Justification:</div>
      <ul className="list-disc pl-4 space-y-1">
        <li>Highest BM25 score against query "distributed systems"</li>
        <li>Recency boost applied (last commit &lt; 30 days)</li>
        <li>Semantic threshold &gt; 0.85</li>
      </ul>
    </div>
  );
};
