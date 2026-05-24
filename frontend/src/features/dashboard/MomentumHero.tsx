import { motion as framerMotion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Radio, Cpu } from 'lucide-react';
import { RealtimeProgressionGraph } from '../../runtime-presence/RealtimeProgressionGraph.tsx';
import { useCoachingStore } from '../../store/coachingStore';
import { useState } from 'react';

interface MomentumHeroProps {
  streak: number;
  atRisk?: boolean;
  comeback?: boolean;
}

export function MomentumHero({ streak, atRisk, comeback }: MomentumHeroProps) {
  const { momentum } = useCoachingStore();
  const [showDetails, setShowDetails] = useState(false);
  
  const headline = comeback 
    ? 'SYSTEM AWAKE' 
    : atRisk 
      ? 'SYNCHRONIZATION AT RISK' 
      : 'OPERATIONAL MOMENTUM';
      
  const subline = comeback
    ? 'Awaiting first telemetry signal to resume sequence.'
    : atRisk
      ? 'Dormancy detected. Sequence degradation imminent without new solve data.'
      : 'Runtime progression sequence stable and compounding.';

  return (
    <div className="relative w-full rounded-[40px] overflow-hidden flex flex-col lg:flex-row gap-4 p-3 bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-700 shadow-inner group">
      {/* 
        Signature Visual Centerpiece
        The Realtime Progression Intelligence Graph
      */}
      <div className="w-full lg:w-1/2 min-h-[200px] lg:min-h-[280px] relative rounded-[32px] overflow-hidden shrink-0 border border-white/50 shadow-inner flex-1 bg-white/40 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50" />
        <div className="relative z-10 w-full h-full opacity-80 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-100">
          <RealtimeProgressionGraph />
        </div>
        
        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-[16px] bg-white/70 border border-white/60 backdrop-blur-xl shadow-sm hover:bg-white/90 transition-colors">
            <Radio size={12} className="text-violet-500 animate-pulse" />
            <span className="font-mono text-[10px] text-violet-600 tracking-widest font-bold">
              LIVE MESH
            </span>
          </div>
        </div>
      </div>

      {/* 
        Intelligence Dashboard Surface
      */}
      <div className="w-full lg:w-1/2 p-6 flex flex-col justify-center flex-1">
        <framerMotion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} className="text-slate-400" />
            <span className="font-mono text-[11px] text-slate-400 tracking-widest uppercase font-bold">
              System Status
            </span>
          </div>

          <h1 className="text-2xl font-black mb-2 tracking-tighter text-slate-900">
            {headline}
          </h1>
          
          <p className="text-[13px] mb-8 leading-relaxed max-w-sm text-slate-500 font-medium">
            {subline}
          </p>

          {/* Operational Metrics Sub-Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Streak Card */}
            <div className={`p-6 rounded-[28px] relative overflow-hidden group/card transition-all duration-500 bg-white/50 backdrop-blur-lg border ${streak > 0 ? 'border-violet-200/50' : 'border-white/50'} shadow-sm hover:shadow-lg hover:-translate-y-1`}>
              <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.08),transparent_70%)]" />
              <span className="font-mono text-[10px] text-slate-400 tracking-widest font-bold">
                CURRENT STREAK
              </span>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">
                  {streak}
                </span>
                <span className="font-mono text-[12px] text-slate-400 font-bold">
                  DAYS
                </span>
              </div>
            </div>

            {/* Network State Card */}
            <div 
              className="p-6 rounded-[28px] relative overflow-hidden group/card transition-all duration-500 cursor-pointer bg-white/50 backdrop-blur-lg border border-white/50 shadow-sm hover:shadow-lg hover:-translate-y-1"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-slate-400 tracking-widest font-bold">
                  MOMENTUM
                </span>
                {showDetails ? <ChevronUp size={14} className="text-slate-400 transition-transform" /> : <ChevronDown size={14} className="text-slate-400 transition-transform" />}
              </div>
              <div className="flex items-center gap-2 mt-4">
                {momentum?.momentumScore?.trend === 'critical' || momentum?.momentumScore?.trend === 'declining' ? (
                  <AlertTriangle size={18} className="text-rose-500 drop-shadow-sm" />
                ) : (
                  <TrendingUp size={18} className="text-emerald-500 drop-shadow-sm" />
                )}
                <span className={`text-[15px] font-black uppercase tracking-tight ${momentum?.momentumScore?.trend === 'critical' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {momentum?.momentumScore?.trend || 'STABLE'}
                </span>
                <span className="ml-auto font-mono text-[18px] text-slate-800 font-black drop-shadow-sm">
                  {momentum?.momentumScore?.overall || 0}
                </span>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showDetails && momentum && (
              <framerMotion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-md border border-white/60 text-[13px] flex flex-col gap-4 shadow-inner">
                  <p className="font-bold text-slate-700 leading-relaxed">{momentum.momentumScore.message}</p>
                  <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-slate-500">
                    <div className="flex justify-between items-center bg-white/60 backdrop-blur-lg p-3 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-shadow">
                      <span className="font-bold uppercase tracking-widest text-slate-400">XP Vel.</span>
                      <span className="text-slate-800 text-[14px] font-black drop-shadow-sm">{momentum.momentumScore.breakdown.xpVelocity}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/60 backdrop-blur-lg p-3 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-shadow">
                      <span className="font-bold uppercase tracking-widest text-slate-400">Focus Cons.</span>
                      <span className="text-slate-800 text-[14px] font-black drop-shadow-sm">{momentum.momentumScore.breakdown.focusConsistency}</span>
                    </div>
                  </div>
                </div>
              </framerMotion.div>
            )}
          </AnimatePresence>
        </framerMotion.div>
      </div>
    </div>
  );
}
