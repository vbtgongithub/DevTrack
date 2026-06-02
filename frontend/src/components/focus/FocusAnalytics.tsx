import React from 'react';
import { motion as framerMotion } from 'framer-motion';
import { BarChart2, Target, Zap, Activity } from 'lucide-react';
import { useMissionStore } from '../../store/missionStore';

export function FocusAnalytics() {
  const getActiveMission = useMissionStore(state => state.getActiveMission);
  const activeMission = getActiveMission();

  const focusQuality = activeMission ? `${activeMission.executionConfidence ?? 0}%` : '94%';
  const sessions = activeMission ? `${activeMission.focusSessions ?? 0}` : '12';
  const velocity = activeMission ? `${activeMission.velocity ?? 0}` : '85';
  const deepWork = activeMission ? `${activeMission.deepWorkHours ?? 0}h` : '4.2h';

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 flex items-center justify-center border border-violet-500/10 shadow-sm">
          <BarChart2 className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tighter">Session Telemetry</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Performance Metrics {activeMission ? `• ${activeMission.title}` : ''}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <MetricCard title="Focus Quality" value={focusQuality} trend="Live" icon={<Target size={16} className="text-violet-500" />} />
        <MetricCard title="Sessions" value={sessions} trend="Total" icon={<Zap size={16} className="text-amber-500" />} />
        <MetricCard title="Velocity" value={velocity} trend="Sprint" icon={<Activity size={16} className="text-emerald-500" />} />
        <MetricCard title="Deep Work" value={deepWork} trend="Logged" icon={<BarChart2 size={16} className="text-blue-500" />} />
      </div>

      <div className="w-full p-6 rounded-[32px] mt-2 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-500 shadow-inner group">
        <div className="flex flex-col">
          <span className="text-[15px] font-black text-slate-800 tracking-tight">Productivity Window</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daily Flow State</span>
        </div>
        <div className="flex items-end gap-1.5 h-12">
          {/* Mock sparkline */}
          {[40, 60, 30, 80, 100, 90, 50, 40, 30, 70, 85, 95].map((val, i) => (
            <div key={i} className="flex flex-col justify-end h-full">
              <framerMotion.div
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
                className={`w-2 rounded-full ${val > 75 ? 'bg-violet-500' : val > 40 ? 'bg-violet-200' : 'bg-slate-100'}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon }: { title: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <div className="p-6 rounded-[28px] flex flex-col gap-3 relative overflow-hidden bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 shadow-inner group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-violet-500/15 transition-colors duration-500" />
      <div className="flex justify-between items-start relative z-10">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
        <div className="w-8 h-8 rounded-[12px] bg-white/50 backdrop-blur-md flex items-center justify-center border border-white/60 shadow-sm">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-3 relative z-10">
        <span className="text-3xl font-black text-slate-800 tracking-tighter">{value}</span>
        <span className="text-[12px] font-bold text-slate-500">{trend}</span>
      </div>
    </div>
  );
}
