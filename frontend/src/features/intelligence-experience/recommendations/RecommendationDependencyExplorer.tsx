// src/features/intelligence-experience/recommendations/RecommendationDependencyExplorer.tsx
// Visualizes prerequisites for a recommendation.

import React from 'react';

export const RecommendationDependencyExplorer: React.FC = () => {
  return (
    <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-700">
      <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Skill Dependencies</h4>
      <div className="flex gap-2 text-sm">
        <div className="px-2 py-1 bg-slate-700 text-slate-300 rounded line-through opacity-50">
          Basic Linux (Met)
        </div>
        <span className="text-slate-500 self-center">→</span>
        <div className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
          Docker Fundamentals (Active)
        </div>
        <span className="text-slate-500 self-center">→</span>
        <div className="px-2 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded">
          Kubernetes (Locked)
        </div>
      </div>
    </div>
  );
};
