// src/features/intelligence-experience/trust/TrustTransparencyLayer.tsx
// Interactive wrapper explaining why a specific inference or score changed.

import React, { useState } from 'react';

interface Props {
  contextId: string;
  summary: string;
  reasoningBlocks: string[];
  children: React.ReactNode;
}

export const TrustTransparencyLayer: React.FC<Props> = ({ contextId: _contextId, summary, reasoningBlocks, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group">
      {children}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-2 right-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition-colors"
      >
        Why?
      </button>
      
      {isOpen && (
        <div className="absolute z-10 top-full mt-2 right-0 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-4 text-sm text-slate-300">
          <div className="font-semibold text-white mb-2">{summary}</div>
          <ul className="space-y-2">
            {reasoningBlocks.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-500">→</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
