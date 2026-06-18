import React from 'react';
import { motion } from 'framer-motion';
import type { ReadinessSnapshot } from '../../../services/readinessService';
import { TrendingUp, TrendingDown, Minus, Target, Shield } from 'lucide-react';

interface Props {
  data: ReadinessSnapshot;
}

export const ReadinessHero: React.FC<Props> = ({ data }) => {
  const { dynamicState, rawMetrics } = data;
  const isStale = rawMetrics?.core?.isDegraded || false;
  const score = dynamicState?.overallScore || 0;
  const momentum = dynamicState?.momentumTrend || 'stagnating';
  const confidence = dynamicState?.confidence || 0;

  const getMomentumConfig = () => {
    switch (momentum) {
      case 'improving': return { icon: <TrendingUp size={16} />, label: 'Accelerating', color: 'text-emerald-300', glow: 'from-emerald-500/20' };
      case 'declining': return { icon: <TrendingDown size={16} />, label: 'Declining', color: 'text-rose-300', glow: 'from-rose-500/20' };
      default: return { icon: <Minus size={16} />, label: 'Steady', color: 'text-amber-300', glow: 'from-amber-500/20' };
    }
  };

  const momCfg = getMomentumConfig();

  // Score ring
  const ringSize = 100;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[24px] bg-slate-900 text-white shadow-xl"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900 to-slate-900" />
      <div className={`absolute inset-0 bg-gradient-to-bl ${momCfg.glow} via-transparent to-transparent opacity-60`} />

      {/* Subtle animated dots */}
      <div className="absolute top-8 right-12 w-1 h-1 rounded-full bg-indigo-400/40 animate-pulse" />
      <div className="absolute top-16 right-24 w-1.5 h-1.5 rounded-full bg-violet-400/30 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-12 right-16 w-1 h-1 rounded-full bg-emerald-400/30 animate-pulse" style={{ animationDelay: '0.5s' }} />

      <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
        {/* Score Ring */}
        <div className="relative shrink-0">
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
            <motion.circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={scoreColor} strokeWidth={strokeWidth}
              strokeLinecap="round" strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300"
            >
              {score}
            </motion.span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
              Readiness Score
            </span>
            {isStale && (
              <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/20">
                Reduced Confidence
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-2 mb-3">
            {dynamicState?.progressionState || 'Discovery & Foundation'}
          </h2>

          {/* Metric strip */}
          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className={momCfg.color}>{momCfg.icon}</span>
              <span className="text-xs font-semibold text-slate-200">{momCfg.label}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Target size={12} className="text-indigo-300" />
              <span className="text-xs font-semibold text-slate-200">{dynamicState?.roleAlignment?.matchScore || 0}% Match</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Shield size={12} className="text-cyan-300" />
              <span className="text-xs font-semibold text-slate-200">{confidence}% Confidence</span>
            </div>
          </div>
        </div>

        {/* Target Role */}
        <div className="shrink-0 hidden md:flex flex-col items-center justify-center px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Target</span>
          <span className="text-sm font-bold text-center text-white">{dynamicState?.roleAlignment?.role || 'Software Engineer'}</span>
        </div>
      </div>
    </motion.div>
  );
};
