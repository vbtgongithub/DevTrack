// src/features/intelligence-experience/realism/ATSExtractionVisualizer.tsx
// Shows the structured JSON output that the ATS generates from raw text.

import React from 'react';

export const ATSExtractionVisualizer: React.FC = () => {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Extracted Entity Graph</h4>
      <pre className="bg-[#0d1117] p-3 rounded font-mono text-xs text-blue-300 overflow-x-auto border border-slate-700">
{`{
  "skills": ["Go", "Kubernetes", "Distributed Systems"],
  "metrics": [
    {"type": "performance", "value": "40%", "context": "throughput improvement"}
  ],
  "confidence": 0.92
}`}
      </pre>
    </div>
  );
};
