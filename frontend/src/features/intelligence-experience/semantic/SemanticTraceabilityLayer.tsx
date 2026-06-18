// src/features/intelligence-experience/semantic/SemanticTraceabilityLayer.tsx
// Core wrapper that makes any semantic match deeply inspectable.

import React from 'react';

export const SemanticTraceabilityLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="group relative border border-slate-700/50 hover:border-blue-500/50 rounded transition-colors bg-slate-800/20 p-2">
      <div className="absolute -top-2 -right-2 hidden group-hover:flex items-center gap-1 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded shadow-lg">
        <span className="font-mono">SEMANTIC_MATCH</span>
      </div>
      {children}
    </div>
  );
};
