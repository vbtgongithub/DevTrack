// src/features/intelligence-experience/realism/RecruiterRealityProjection.tsx
// Simulates a recruiter's scanning behavior and perception of the profile.

import React from 'react';

export const RecruiterRealityProjection: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        Recruiter Reality Projection
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded">
          <div className="text-xs text-emerald-400 uppercase font-semibold mb-1">Strongest Signal</div>
          <div className="text-sm text-slate-300">Modern backend tech stack (Go/K8s) verified by GitHub.</div>
        </div>
        <div className="p-3 bg-rose-900/10 border border-rose-500/20 rounded">
          <div className="text-xs text-rose-400 uppercase font-semibold mb-1">Trust Blocker</div>
          <div className="text-sm text-slate-300">Unclear system architecture experience (low design evidence).</div>
        </div>
      </div>
    </div>
  );
};
