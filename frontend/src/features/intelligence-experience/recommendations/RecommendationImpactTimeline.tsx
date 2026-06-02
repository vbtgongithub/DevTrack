// src/features/intelligence-experience/recommendations/RecommendationImpactTimeline.tsx
// Projects the future impact of completing a recommendation series.

import React from 'react';

export const RecommendationImpactTimeline: React.FC = () => {
  return (
    <div className="mt-6 border-t border-slate-700 pt-4">
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Projected Impact Timeline</h4>
      <div className="relative border-l border-slate-600 ml-3 space-y-6">
        <div className="relative pl-6">
          <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[1.5px] top-1"></div>
          <div className="text-sm font-medium text-slate-200">Current State</div>
          <div className="text-xs text-slate-500 mt-1">Backend Readiness: 45%</div>
        </div>
        <div className="relative pl-6">
          <div className="absolute w-3 h-3 bg-slate-700 border-2 border-emerald-500 rounded-full -left-[1.5px] top-1"></div>
          <div className="text-sm font-medium text-slate-200">After completing Docker/CI sequence</div>
          <div className="text-xs text-emerald-400 mt-1">Projected Backend Readiness: ~65%</div>
        </div>
      </div>
    </div>
  );
};
