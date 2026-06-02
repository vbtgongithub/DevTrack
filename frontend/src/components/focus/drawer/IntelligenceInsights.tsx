import React from 'react';
import type { Mission } from '../../../store/missionStore';
import { Sparkles } from 'lucide-react';

export const IntelligenceInsights: React.FC<{ mission: Mission }> = ({ mission }) => {
  // Determine gradient based on confidence and velocity
  const isPositive = mission.executionConfidence > 60 && mission.velocity > 50;
  
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <Sparkles size={14} className="text-violet-500" /> AI Runtime Intelligence
      </h3>
      
      <div className={`p-5 rounded-[20px] border relative overflow-hidden group ${
        isPositive 
          ? 'bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-500/10' 
          : 'bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/10'
      }`}>
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_3s_infinite]" />
        
        <p className="text-[14px] font-medium text-slate-700 leading-relaxed relative z-10">
          {mission.aiInsight || 'Initializing telemetry analysis... run focus sessions to generate insights.'}
        </p>
      </div>
    </div>
  );
};
