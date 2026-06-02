// src/features/intelligence-experience/narrative/ConversationalEngineeringMentor.tsx
// Chat interface bound to technical intelligence constraints.

import React, { useState } from 'react';

export const ConversationalEngineeringMentor: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="flex flex-col h-[400px] bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      <div className="bg-slate-800 p-3 border-b border-slate-700 font-medium text-slate-200 flex justify-between items-center">
        <span>Conversational Engineering Mentor</span>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">Bounded Logic</span>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="bg-slate-800 p-3 rounded-lg rounded-tl-none w-5/6 text-sm text-slate-300">
          Your infrastructure maturity has increased by 15% this month. Would you like me to explain why?
        </div>
      </div>
      
      <div className="p-3 border-t border-slate-700 bg-slate-800">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask why your ATS confidence is low..."
          className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
};
