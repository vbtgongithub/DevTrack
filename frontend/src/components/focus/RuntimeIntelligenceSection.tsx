import React from 'react';

import { BrainCircuit, Activity, ShieldAlert, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { useRIEStore } from '../../runtime-intelligence/rieStore';

export const RuntimeIntelligenceSection: React.FC = () => {
  const { 
    executionStabilityScore, 
    operationalMomentum, 
    burnoutProbability, 
    activeInsights, 
    primaryRecommendation 
  } = useRIEStore();

  const isAtRisk = burnoutProbability > 70 || executionStabilityScore < 50;

  return (
    <div className="w-full flex flex-col gap-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Runtime Intelligence</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">Execution Operating System</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric 1: Momentum */}
        <div className="bg-white/40 backdrop-blur-md rounded-[20px] p-5 border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:bg-blue-500/10"/>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 relative z-10">
            <Zap size={12} className="text-blue-500"/> Operational Momentum
          </span>
          <div className="flex items-end gap-2 relative z-10 mt-1">
            <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{operationalMomentum}</span>
            <span className="text-[11px] font-bold text-slate-400 mb-1">/ 100</span>
          </div>
        </div>

        {/* Metric 2: Stability */}
        <div className="bg-white/40 backdrop-blur-md rounded-[20px] p-5 border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:bg-emerald-500/10"/>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 relative z-10">
            <Activity size={12} className="text-emerald-500"/> Execution Stability
          </span>
          <div className="flex items-end gap-2 relative z-10 mt-1">
            <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{executionStabilityScore}</span>
            <span className="text-[11px] font-bold text-slate-400 mb-1">/ 100</span>
          </div>
        </div>

        {/* Metric 3: Burnout Risk */}
        <div className={`backdrop-blur-md rounded-[20px] p-5 border shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden group transition-all duration-500 ${
          burnoutProbability > 70 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/40 border-white/60'
        }`}>
          <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -mr-4 -mt-4 transition-all ${
            burnoutProbability > 70 ? 'bg-rose-500/10 group-hover:bg-rose-500/20' : 'bg-amber-500/5 group-hover:bg-amber-500/10'
          }`}/>
          <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-1 relative z-10 text-slate-400">
            <ShieldAlert size={12} className={burnoutProbability > 70 ? 'text-rose-500' : 'text-amber-500'}/> Burnout Risk
          </span>
          <div className="flex items-end gap-2 relative z-10 mt-1">
            <span className={`text-4xl font-black tracking-tighter leading-none ${burnoutProbability > 70 ? 'text-rose-600' : 'text-slate-800'}`}>
              {burnoutProbability}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Insights Box */}
        <div className={`p-6 rounded-[24px] border relative overflow-hidden flex flex-col justify-center min-h-[140px] ${
          isAtRisk 
            ? 'bg-gradient-to-br from-amber-500/5 to-rose-500/5 border-amber-500/20'
            : 'bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border-indigo-500/20'
        }`}>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_3s_infinite]" />
          <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3 relative z-10 text-slate-500">
            <Sparkles size={12} className={isAtRisk ? "text-amber-500" : "text-indigo-500"} /> Live Telemetry Insights
          </h3>
          <div className="relative z-10 flex flex-col gap-2">
            {activeInsights.map((insight, idx) => (
              <p key={idx} className="text-[14px] font-medium text-slate-700 leading-relaxed">
                {insight}
              </p>
            ))}
          </div>
        </div>

        {/* Actionable Recommendation */}
        <div className="p-6 rounded-[24px] bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[140px] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-500/20"/>
          
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 text-slate-400">
              Strategic Directive
            </h3>
            <p className="text-white font-bold text-lg leading-tight mb-2">
              {primaryRecommendation.action}
            </p>
            <p className="text-slate-400 text-[13px] font-medium leading-relaxed">
              {primaryRecommendation.description}
            </p>
          </div>
          
          <div className="relative z-10 mt-4 flex justify-end">
            <button className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
              Acknowledge <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
