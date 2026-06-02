import React from 'react';
import { AlertOctagon, TrendingUp, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export const ContextualIntelligenceRail: React.FC = () => {
  return (
    <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-5 xl:border-l border-slate-200/60 xl:pl-6 h-full sticky top-4">
      
      {/* Fancy Header */}
      <div className="hidden xl:flex items-center gap-2 mb-2">
        <div className="h-4 w-1 rounded-full bg-gradient-to-b from-fuchsia-500 to-violet-600" />
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Intelligence Rail</h2>
      </div>

      {/* Top Recruiter Risk */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="flex flex-col gap-3 p-5 bg-white/60 backdrop-blur-md rounded-2xl border border-rose-100 shadow-[0_4px_20px_-4px_rgba(225,29,72,0.05)] relative overflow-hidden group cursor-default"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-orange-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-400/5 rounded-full blur-xl group-hover:bg-rose-400/10 transition-colors duration-500" />
        
        <h3 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1.5 relative z-10">
          <AlertOctagon size={14} className="text-rose-500" />
          Top Recruiter Risk
        </h3>
        <p className="text-sm font-medium text-slate-700 leading-relaxed relative z-10">
          Vague scalability claims in <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded border border-rose-100">Project Alpha</span> reduce technical credibility.
        </p>
      </motion.div>

      {/* Strongest Signal */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="flex flex-col gap-3 p-5 bg-white/60 backdrop-blur-md rounded-2xl border border-emerald-100 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.05)] relative overflow-hidden group cursor-default"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-400/5 rounded-full blur-xl group-hover:bg-emerald-400/10 transition-colors duration-500" />

        <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 relative z-10">
          <TrendingUp size={14} className="text-emerald-500" />
          Strongest Signal
        </h3>
        <p className="text-sm font-medium text-slate-700 leading-relaxed relative z-10">
          Clear evidence of deployment maturity using <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded border border-emerald-100">AWS ECS & Docker</span>.
        </p>
      </motion.div>

      {/* Optimization Priority (Pink/Purple) */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="flex flex-col gap-3 p-5 bg-gradient-to-br from-fuchsia-50/80 to-violet-50/80 backdrop-blur-xl rounded-2xl border border-fuchsia-200/60 shadow-[0_4px_20px_-4px_rgba(217,70,239,0.12)] relative overflow-hidden group cursor-default"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-violet-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-fuchsia-400/20 to-violet-400/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

        <h3 className="text-[10px] font-bold text-fuchsia-700 uppercase tracking-widest flex items-center gap-1.5 relative z-10">
          <Cpu size={14} />
          Optimization Priority
        </h3>
        <p className="text-sm font-medium text-slate-800 leading-relaxed relative z-10">
          Quantify API performance metrics to transition from "CRUD-heavy" to "Scale-aware".
        </p>
      </motion.div>

    </div>
  );
};
