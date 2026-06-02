// src/features/intelligence-experience/evidence/EvidenceGraphExplorer.tsx
// Interactive explorer for traversing the evidence graph underlying a user's profile.

import React from 'react';

export const EvidenceGraphExplorer: React.FC = () => {
  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Evidence Graph Explorer</h4>
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        <div className="flex-shrink-0 w-48 p-3 bg-slate-800 rounded border border-emerald-500/30">
          <div className="text-xs text-emerald-400 mb-1">Source Node</div>
          <div className="font-mono text-sm truncate">github_repo_abc</div>
        </div>
        <div className="text-slate-500">→</div>
        <div className="flex-shrink-0 w-48 p-3 bg-slate-800 rounded border border-blue-500/30">
          <div className="text-xs text-blue-400 mb-1">Derived Signal</div>
          <div className="font-mono text-sm truncate">Microservices</div>
        </div>
        <div className="text-slate-500">→</div>
        <div className="flex-shrink-0 w-48 p-3 bg-slate-800 rounded border border-purple-500/30">
          <div className="text-xs text-purple-400 mb-1">Impact</div>
          <div className="font-mono text-sm truncate">Backend Readiness</div>
        </div>
      </div>
    </div>
  );
};
