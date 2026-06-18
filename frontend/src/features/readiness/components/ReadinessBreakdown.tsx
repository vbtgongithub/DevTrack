import React from 'react';
import { motion } from 'framer-motion';
import type { MomentumIntelligence } from '../../../services/observationService';

interface Props {
  momentum: MomentumIntelligence;
}

export const ReadinessBreakdown: React.FC<Props> = ({ momentum }) => {
  const breakdown = [
    { label: 'Activity Frequency', value: momentum.momentumScore.breakdown.activityFrequency, color: 'bg-emerald-500' },
    { label: 'XP Velocity', value: momentum.momentumScore.breakdown.xpVelocity, color: 'bg-blue-500' },
    { label: 'Streak Health', value: momentum.momentumScore.breakdown.streakHealth, color: 'bg-orange-500' },
    { label: 'Focus Consistency', value: momentum.momentumScore.breakdown.focusConsistency, color: 'bg-violet-500' },
    { label: 'Problem Diversity', value: momentum.momentumScore.breakdown.problemDiversity, color: 'bg-fuchsia-500' },
  ];

  return (
    <div className="dt-card-base bg-white/60 backdrop-blur-3xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Readiness Breakdown</h3>
        <p className="text-xs text-slate-500 font-medium">Weighted factors calculating your score</p>
      </div>

      <div className="space-y-5">
        {breakdown.map((item, i) => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-700">{item.label}</span>
              <span className="text-xs font-black text-slate-400">{item.value}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${item.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
