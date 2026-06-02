// src/features/intelligence-experience/recommendations/RecommendationReasoningExperience.tsx
// Core wrapper for the recommendation engine's reasoning output.

import React from 'react';

export const RecommendationReasoningExperience: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        Intelligence Reasoning Engine
      </h3>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
