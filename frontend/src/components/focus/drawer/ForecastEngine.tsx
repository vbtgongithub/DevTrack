import React from 'react';
import type { Mission } from '../../../store/missionStore';
import { Compass, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const ForecastEngine: React.FC<{ mission: Mission }> = ({ mission }) => {
  const est = mission.estimatedHours || 1;
  const actual = mission.actualHours || 0;
  
  // Predict progress
  let rawProgress = (actual / est) * 100;
  if (rawProgress > 100) rawProgress = 100;

  // Probability based on velocity and confidence
  const probability = Math.min(99, Math.round(((mission.executionConfidence || 0) + (mission.velocity || 0)) / 2) + 10);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <Compass size={14} /> Completion Forecast
      </h3>
      
      <div className="bg-white/40 p-5 rounded-[20px] border border-white/60 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Probability of Success</span>
            <span className="text-3xl font-black text-slate-800 tracking-tighter flex items-baseline gap-1">
              {probability}% <TrendingUp size={14} className="text-emerald-500" />
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trajectory</span>
            <span className="text-[13px] font-black text-slate-700">{rawProgress < 30 ? 'Initial Phase' : rawProgress < 70 ? 'Steady Execution' : 'Final Approach'}</span>
          </div>
        </div>

        <div className="w-full bg-slate-200/50 rounded-full h-2 relative overflow-hidden mt-1">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${rawProgress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute left-0 top-0 bottom-0 bg-violet-500 rounded-full"
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>0h</span>
          <span>Actual: {actual}h</span>
          <span>Est: {est}h</span>
        </div>
      </div>
    </div>
  );
};
