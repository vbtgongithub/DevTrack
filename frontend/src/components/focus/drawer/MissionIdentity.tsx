import React from 'react';
import type { Mission } from '../../../store/missionStore';
import { Target, AlertTriangle, Calendar, Tag } from 'lucide-react';


export const MissionIdentity: React.FC<{ mission: Mission }> = ({ mission }) => {
  return (
    <div className="flex flex-col gap-4 bg-white/40 p-6 rounded-[24px] border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center border border-violet-200">
            <Target className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{mission.title}</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{mission.category} • {mission.priority} Priority</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mission.status === 'active' && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
            </span>
          )}
        </div>
      </div>
      
      <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
        {mission.description}
      </p>

      <div className="flex flex-wrap gap-2 mt-2">
        {mission.tags?.map((tag, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-[10px] font-black uppercase text-slate-500 tracking-widest">
            <Tag size={10} /> {tag}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> Started</span>
          <span className="text-[13px] font-black text-slate-800">{new Date(mission.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <AlertTriangle size={12}/> Health
          </span>
          <span className={`text-[13px] font-black uppercase tracking-widest ${mission.health === 'critical' ? 'text-red-500' : mission.health === 'at-risk' ? 'text-amber-500' : 'text-emerald-500'}`}>
            {mission.health}
          </span>
        </div>
      </div>
    </div>
  );
};
