import React from 'react';
import { motion } from 'framer-motion';
import type { WeakTopicCluster } from '../../../services/observationService';

interface Props {
  topics: WeakTopicCluster[];
}

export const TopicMasteryHeatmap: React.FC<Props> = ({ topics }) => {
  // We'll pad the array or sort it to show the grid.
  // In a real app, you might have a fixed list of topics. Here we use the weakTopics payload.
  
  const getHeatmapColor = (rate: number) => {
    if (rate >= 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700';
    if (rate >= 50) return 'bg-violet-500/10 border-violet-500/20 text-violet-700';
    if (rate >= 30) return 'bg-amber-500/10 border-amber-500/20 text-amber-700';
    return 'bg-rose-500/10 border-rose-500/20 text-rose-700';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '↑';
    if (trend === 'declining') return '↓';
    return '→';
  };

  if (!topics || topics.length === 0) {
    return (
      <div className="dt-card-base p-8 text-center text-slate-500">
        No topic data available yet. Keep solving problems!
      </div>
    );
  }

  return (
    <div className="dt-card-base bg-white/60 backdrop-blur-3xl p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Topic Mastery</h3>
        <p className="text-xs text-slate-500 font-medium">Confidence & retention across domains</p>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
        {topics.map((t, i) => (
          <motion.div
            key={t.topic}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`p-3 rounded-2xl border flex flex-col justify-between transition-colors hover:bg-white/80 ${getHeatmapColor(t.solveRate)}`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold truncate max-w-[70%]">{t.topic}</span>
              <span className="text-[10px] font-black opacity-60">
                {getTrendIcon(t.trendDirection)}
              </span>
            </div>
            
            <div className="flex items-end justify-between">
              <span className="text-xl font-black tracking-tighter leading-none">
                {t.solveRate}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                {t.solvedCount}/{t.totalProblems}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
