import React from 'react';
import { BrainCircuit, ArrowRight } from 'lucide-react';
import type { WeakTopicCluster } from '../../../services/observationService';

interface Props {
  topics: WeakTopicCluster[];
}

export const WeakTopicIntelligence: React.FC<Props> = ({ topics }) => {
  // Deterministic: Max one recommendation at a time.
  // We'll take the weakest topic with declining or stagnant trend.
  const weakestTarget = topics.find(t => t.trendDirection !== 'improving') || topics[topics.length - 1];

  if (!weakestTarget) {
    return null;
  }

  return (
    <div className="dt-card-base bg-white/60 backdrop-blur-3xl p-6 lg:p-8 relative overflow-hidden group border border-slate-200/50 hover:border-violet-200 transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-[40px] -mr-10 -mt-10 group-hover:bg-violet-500/10 transition-colors duration-700" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[14px] bg-violet-50 flex items-center justify-center text-violet-600">
          <BrainCircuit size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Recovery Insight</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Targeted Recommendation</p>
        </div>
      </div>

      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
        <p className="text-sm font-medium text-slate-700 leading-relaxed">
          <strong className="text-slate-900">{weakestTarget.topic}</strong> retention dropped recently. 
          Your solve rate sits at <strong className="text-violet-600">{weakestTarget.solveRate}%</strong> out of {weakestTarget.totalProblems} problems.
        </p>
        
        <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Suggested difficulty: <span className="font-bold text-slate-700">{weakestTarget.suggestedDifficulty}</span>
          </div>
          <button className="text-xs font-bold text-violet-600 flex items-center gap-1 hover:text-violet-700 transition-colors">
            Start Session <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
