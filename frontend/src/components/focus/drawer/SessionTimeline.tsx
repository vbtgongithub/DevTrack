import React from 'react';
import type { Mission } from '../../../store/missionStore';
import { History, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const SessionTimeline: React.FC<{ mission: Mission }> = ({ mission }) => {
  const sessions = mission.sessions || [];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <History size={14} /> Focus Session Timeline
      </h3>
      
      {sessions.length === 0 ? (
        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-[13px] font-bold text-slate-400">No sessions logged yet.</span>
          <span className="text-[11px] font-medium text-slate-400 mt-1">Run a focus session to see it here.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 relative before:absolute before:inset-y-2 before:left-[15px] before:w-0.5 before:bg-slate-200">
          {sessions.map((session, index) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 relative z-10"
            >
              <div className="w-8 h-8 rounded-full bg-white border-2 border-violet-500 flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                <CheckCircle2 size={12} className="text-violet-600" />
              </div>
              <div className="flex-1 bg-white/40 p-3 rounded-[16px] border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-start">
                  <span className="text-[13px] font-black text-slate-800">{session.type}</span>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{session.durationMinutes}m</span>
                  <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">+{session.contributionScore} Confidence</span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{session.quality}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
