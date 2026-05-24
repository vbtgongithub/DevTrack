
import { HeartPulse, Zap, Battery } from 'lucide-react';

export function RecoveryIntelligence() {
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 flex items-center justify-center border border-rose-500/10 shadow-sm">
          <HeartPulse className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tighter">Recovery Intelligence</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Psychological Metrics</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Readiness Card */}
        <div className="p-6 rounded-[28px] flex flex-col gap-3 relative overflow-hidden bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 shadow-inner group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/15 transition-colors duration-500" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cognitive Readiness</span>
            <div className="w-8 h-8 rounded-[12px] bg-white/50 backdrop-blur-md flex items-center justify-center border border-white/60 shadow-sm">
              <Zap size={14} className="text-emerald-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3 relative z-10">
            <span className="text-3xl font-black text-slate-800 tracking-tighter">98%</span>
            <span className="text-[12px] font-bold text-slate-500">Fully recovered</span>
          </div>
        </div>

        {/* Burnout Risk Card */}
        <div className="p-6 rounded-[28px] flex flex-col gap-3 relative overflow-hidden bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 shadow-inner group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/15 transition-colors duration-500" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Burnout Risk</span>
            <div className="w-8 h-8 rounded-[12px] bg-white/50 backdrop-blur-md flex items-center justify-center border border-white/60 shadow-sm">
              <Battery size={14} className="text-emerald-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3 relative z-10">
            <span className="text-3xl font-black text-slate-800 tracking-tighter">Low</span>
            <span className="text-[12px] font-bold text-slate-500">Pacing well</span>
          </div>
        </div>
      </div>
    </div>
  );
}

