// src/features/intelligence-experience/recommendations/RecommendationReasoningPanel.tsx
// Detailed breakdown of why a specific recommendation was made.

import React from 'react';

export const RecommendationReasoningPanel: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="bg-slate-800 rounded-md p-4 border border-slate-700/50">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-slate-200">{title}</h4>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
          Confidence: High
        </span>
      </div>
      <div className="text-sm text-slate-400 mb-3">
        This recommendation was generated because your infrastructure maturity (0.4) is blocking progression for Senior Backend roles.
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-900 p-2 rounded">
          <span className="text-slate-500 block mb-1">Trigger Evidence</span>
          <span className="text-slate-300">Missing Docker/CI in 3 primary repos</span>
        </div>
        <div className="bg-slate-900 p-2 rounded">
          <span className="text-slate-500 block mb-1">ATS Impact</span>
          <span className="text-emerald-400">+15% infrastructure keyword match</span>
        </div>
      </div>
    </div>
  );
};
