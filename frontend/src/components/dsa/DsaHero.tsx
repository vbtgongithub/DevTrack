import React from 'react';
import type { DsaData } from '../../types/dsa';
import { Icon } from '../shared/Icon';
import { motion } from 'framer-motion';

export type DsaHeroProps = {
  heatmap: number[];
  stats: DsaData['stats'];
};

export const DsaHero: React.FC<DsaHeroProps> = ({ heatmap, stats }) => {
  const activeDays = React.useMemo(() => heatmap.filter((v) => v > 0).length, [heatmap]);

  const totalSolvedStat = stats.find((s) => s.label === 'Problems Solved');
  const totalSolved = totalSolvedStat?.value ?? '0';

  const lcRatingStat = stats.find((s) => s.label === 'LeetCode Rating');
  const cfStat = stats.find((s) => s.label === 'CF Rating');

  const ratingDisplay = lcRatingStat?.value && lcRatingStat.value !== '—'
    ? `LC: ${lcRatingStat.value}`
    : cfStat?.value && cfStat.value !== '—'
      ? `CF: ${cfStat.value}`
      : 'No rating';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden bg-white/70 backdrop-blur-3xl border border-dt-primary/15 rounded-[40px] p-10 lg:p-12 shadow-[0_32px_120px_rgba(124,92,252,0.1)] transition-all duration-700 group/hero"
    >
      {/* Immersive Neural Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-dt-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 opacity-40 group-hover/hero:scale-110 transition-transform duration-1000" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-dt-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 opacity-30 group-hover/hero:scale-110 transition-transform duration-1000 delay-150" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #7C5CFC 1px, transparent 0)`, backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 lg:gap-16">
        <div className="flex flex-col gap-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/50 border border-dt-primary/10 w-fit backdrop-blur-xl shadow-sm"
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </div>
            <span className="text-[10px] font-black text-dt-textSecondary/70 tracking-[0.3em] uppercase">Neural Ingress: Stable</span>
          </motion.div>

          <div className="flex flex-col gap-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl lg:text-6xl font-black tracking-tight text-dt-text leading-[1.05]"
            >
              Welcome to the <br />
              <span className="relative inline-block mt-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-dt-primary via-[#A78BFA] to-[#FF8B94] animate-gradient-x drop-shadow-sm">
                  AI Engineering Cockpit.
                </span>
                <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-dt-primary to-transparent rounded-full blur-[1px] opacity-40" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-[17px] font-bold text-dt-textSecondary/80 leading-relaxed max-w-xl mt-2 tracking-wide"
            >
              Intelligence architecture is fully synchronized. Your current operational baseline sits at <strong className="font-black text-dt-text">{totalSolved} solutions</strong> with a verified <strong className="font-black text-dt-text">{activeDays}-day</strong> high-velocity streak.
            </motion.p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {[
              { icon: 'fire', label: `${activeDays}-Day Streak`, sub: 'Momentum', color: 'orange' },
              { icon: 'bolt', label: 'Daily: 2/3', sub: 'Target ROI', color: 'emerald' },
              { icon: 'trophy', label: ratingDisplay, sub: 'Rank Tier', color: 'amber' },
            ].map((pill, i) => (
              <motion.div
                key={pill.label}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5, type: 'spring' }}
                className="group cursor-default relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-${pill.color}-400/20 to-${pill.color}-600/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-500`} />
                <div className="relative flex items-center gap-4 bg-white/70 px-5 py-3 rounded-2xl border border-dt-primary/5 shadow-sm backdrop-blur-md group-hover:border-dt-primary/20 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-xl bg-${pill.color}-500/5 flex items-center justify-center border border-${pill.color}-500/10 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon name={pill.icon} size={18} className={`text-${pill.color}-500`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-dt-text leading-none">{pill.label}</span>
                    <span className={`text-[10px] font-black text-${pill.color}-500/70 tracking-widest uppercase mt-1.5`}>{pill.sub}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Insight Recommendation Engine */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 lg:w-[320px] relative"
        >
          <div className="group/ai relative bg-white/90 backdrop-blur-3xl p-8 rounded-[40px] border border-dt-primary/20 shadow-[0_40px_100px_rgba(124,92,252,0.15)] hover:shadow-[0_50px_120px_rgba(124,92,252,0.25)] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
            {/* Pulsing Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-dt-primary/10 to-transparent animate-pulse opacity-50" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-dt-primary/20 rounded-full blur-[40px] group-hover/ai:scale-150 transition-transform duration-1000" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-dt-primary/10 border border-dt-primary/20 flex items-center justify-center shadow-inner group-hover/ai:rotate-[15deg] transition-transform duration-700">
                  <Icon name="sparkles" size={20} className="text-dt-primary drop-shadow-[0_0_10px_rgba(124,92,252,0.8)]" />
                </div>
                <span className="text-[11px] font-black text-dt-primary uppercase tracking-[0.3em]">Neural Engine</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Scan</span>
                <div className="flex gap-0.5 mt-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1 h-1 rounded-full bg-emerald-500"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-dt-primary/10 text-[9px] font-black text-dt-primary uppercase tracking-widest">Priority: Ultra</span>
                <span className="text-[9px] font-black text-dt-textSecondary/40 uppercase tracking-widest">Match: 98%</span>
              </div>
              <h4 className="text-[20px] font-black text-dt-text leading-tight tracking-tight">
                Review DP bottom-up <br /> optimization patterns.
              </h4>
              <p className="text-[13px] font-bold text-dt-textSecondary/80 opacity-70 group-hover/ai:opacity-100 transition-opacity tracking-wide leading-relaxed">
                Critical velocity decay detected in competitive algorithmic vectors. Synthesis recommended.
              </p>
            </div>

            {/* AI Action Indicator */}
            <div className="mt-8 pt-6 border-t border-dt-primary/10 relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-dt-primary animate-pulse" />
                 <span className="text-[10px] font-black text-dt-textSecondary uppercase tracking-widest">Ready for Synthesis</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full bg-dt-primary text-white flex items-center justify-center shadow-lg shadow-dt-primary/20"
              >
                <Icon name="arrow-right" size={14} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
