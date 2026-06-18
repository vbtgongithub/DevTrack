import React from 'react';
import type { Mission } from '../../../store/missionStore';
import { Zap, Activity, Target, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export const MissionRuntimePanel: React.FC<{ mission: Mission }> = ({ mission }) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Runtime Telemetry</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1 */}
        <div className="bg-white/40 p-4 rounded-2xl border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl -mr-4 -mt-4 transition-all group-hover:bg-blue-500/10"/>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2 relative z-10">
            <Activity size={12} className="text-blue-500"/> Velocity
          </span>
          <span className="text-2xl font-black text-slate-800 tracking-tighter relative z-10">{mission.velocity || 0} <span className="text-xs font-bold text-slate-400">pts/w</span></span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white/40 p-4 rounded-2xl border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-xl -mr-4 -mt-4 transition-all group-hover:bg-violet-500/10"/>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2 relative z-10">
            <Target size={12} className="text-violet-500"/> Confidence
          </span>
          <span className="text-2xl font-black text-slate-800 tracking-tighter relative z-10">{mission.executionConfidence || 0}%</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white/40 p-4 rounded-2xl border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl -mr-4 -mt-4 transition-all group-hover:bg-amber-500/10"/>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2 relative z-10">
            <Zap size={12} className="text-amber-500"/> Sessions
          </span>
          <span className="text-2xl font-black text-slate-800 tracking-tighter relative z-10">{mission.focusSessions || 0}</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white/40 p-4 rounded-2xl border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl -mr-4 -mt-4 transition-all group-hover:bg-orange-500/10"/>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2 relative z-10">
            <Flame size={12} className="text-orange-500"/> Streak Contrib
          </span>
          <span className="text-2xl font-black text-slate-800 tracking-tighter relative z-10">{mission.streakContribution || 0}</span>
        </div>
      </div>
      
      {/* Sparkline Visual (Placeholder for graph) */}
      <div className="w-full h-12 flex items-end gap-1 px-1 mt-2">
        {[40, 50, 30, 60, 80, 50, 90, 100, 85, 70].map((v, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${v}%` }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className={`flex-1 rounded-t-sm ${v > 80 ? 'bg-violet-500' : 'bg-slate-200'}`}
          />
        ))}
      </div>
    </div>
  );
};
