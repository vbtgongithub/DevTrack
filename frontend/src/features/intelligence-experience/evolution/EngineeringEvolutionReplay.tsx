// src/features/intelligence-experience/evolution/EngineeringEvolutionReplay.tsx
// Visualizes the progression of an engineer's profile over time.

import React from 'react';

export const EngineeringEvolutionReplay: React.FC = () => {
  return (
    <div className="border border-slate-700 bg-slate-800 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Engineering Evolution Timeline</h3>
      <div className="relative border-l-2 border-slate-600 ml-4 space-y-8 py-2">
        <div className="relative pl-6">
          <div className="absolute w-4 h-4 bg-slate-900 border-2 border-emerald-500 rounded-full -left-[9px] top-1"></div>
          <div className="font-semibold text-emerald-400">Month 9</div>
          <div className="text-slate-200 font-medium">Distributed Infrastructure Phase</div>
          <div className="text-sm text-slate-400 mt-1">Introduced Kafka and K8s configuration.</div>
        </div>
        <div className="relative pl-6">
          <div className="absolute w-4 h-4 bg-slate-900 border-2 border-blue-500 rounded-full -left-[9px] top-1"></div>
          <div className="font-semibold text-blue-400">Month 6</div>
          <div className="text-slate-200 font-medium">Asynchronous Queue Systems</div>
          <div className="text-sm text-slate-400 mt-1">Moved from synchronous processing to Redis + BullMQ.</div>
        </div>
        <div className="relative pl-6">
          <div className="absolute w-4 h-4 bg-slate-900 border-2 border-purple-500 rounded-full -left-[9px] top-1"></div>
          <div className="font-semibold text-purple-400">Month 1</div>
          <div className="text-slate-200 font-medium">CRUD Foundations</div>
          <div className="text-sm text-slate-400 mt-1">Initial Express + PostgreSQL setup.</div>
        </div>
      </div>
    </div>
  );
};
