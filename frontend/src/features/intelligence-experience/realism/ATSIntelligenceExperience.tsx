// src/features/intelligence-experience/realism/ATSIntelligenceExperience.tsx
// Interactive container to simulate ATS perspective on resumes and profiles.

import React from 'react';

export const ATSIntelligenceExperience: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            ATS Intelligence Simulator
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            See exactly how standard ATS parsers interpret your engineering profile.
          </p>
        </div>
        <div className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1 rounded border border-purple-500/20 font-mono">
          PARSER_VERSION: 4.1.2
        </div>
      </header>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
