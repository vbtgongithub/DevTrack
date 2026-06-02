// src/features/intelligence-experience/roadmap/RoadmapIntelligenceExperience.tsx
// Renders a living, dynamic roadmap connected to backend evidence triggers.

import React from 'react';

export const RoadmapIntelligenceExperience: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        Living Intelligence Roadmap
      </h3>
      <div className="space-y-4">
        <div className="flex gap-4 opacity-50">
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-emerald-500">✓</div>
          <div>
            <div className="font-semibold text-slate-300">Phase 1: REST API Foundations</div>
            <div className="text-sm text-slate-500">Completed: Evidence found in 'backend-api' repo</div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <div className="font-semibold text-slate-200">Phase 2: Redis & Queue Systems</div>
            <div className="text-sm text-blue-400 mt-1">Recommended next step based on role target</div>
            <div className="text-xs text-slate-400 mt-2">Blocks: Distributed Systems, K8s Deployment</div>
          </div>
        </div>
        <div className="flex gap-4 opacity-30">
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-slate-600">?</div>
          <div>
            <div className="font-semibold text-slate-300">Phase 3: Microservices & K8s</div>
            <div className="text-sm text-slate-500 mt-1">Locked: Requires Phase 2 evidence</div>
          </div>
        </div>
      </div>
    </div>
  );
};
