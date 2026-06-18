// src/features/intelligence-experience/evidence/ClaimLineageVisualizer.tsx
// Visualizes the lineage of a specific claim (e.g., "Senior Backend Engineer").

import React from 'react';

export const ClaimLineageVisualizer: React.FC<{ claim: string }> = ({ claim }) => {
  return (
    <div className="text-sm text-slate-300">
      <div className="font-semibold mb-2 text-slate-200">Claim Lineage: {claim}</div>
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Verified 12+ months of consistent backend commits (GitHub)</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Detected production-grade Redis configuration</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Incomplete CI/CD pipeline evidence (reduces confidence by 10%)</span>
        </li>
      </ul>
    </div>
  );
};
