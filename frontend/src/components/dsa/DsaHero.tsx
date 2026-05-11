import React from 'react';
import type { DsaData } from '../../types/dsa';
import { Icon } from '../shared/Icon';

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
    <div className="relative overflow-hidden bg-gradient-to-br from-white/70 via-white/40 to-dt-primary/5 backdrop-blur-2xl border border-dt-primary/10 rounded-2xl p-5 sm:p-6 shadow-dt-elevated transition-all duration-500 group/hero hover:shadow-dt-floating">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-dt-primary/8 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-50 group-hover/hero:scale-105 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-dt-secondary/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none opacity-40 group-hover/hero:scale-105 transition-transform duration-700 delay-75" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/40 border border-dt-primary/10 w-fit backdrop-blur-md group-hover/hero:border-dt-primary/20 transition-colors">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </div>
            <span className="text-[9px] font-black text-dt-textSecondary tracking-widest uppercase">Neural Link: Active</span>
          </div>

          <div className="flex flex-col gap-1.5 relative z-10">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-dt-text leading-[1.15]">
              Welcome back to the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-dt-primary via-[#A78BFA] to-[#FF8B94] animate-gradient-x drop-shadow-sm">
                AI Coding Command Center.
              </span>
            </h1>
            <p className="text-[14px] font-bold text-dt-textSecondary/80 leading-relaxed max-w-lg mt-1 tracking-wide">
              Your intelligence architecture is synchronizing. You've engineered <strong className="font-black text-dt-text drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{totalSolved} solutions</strong>, maintaining high-velocity focus for {activeDays} days.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Compressed Premium Streak */}
            <div className="relative group cursor-default">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400/20 to-amber-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg border border-orange-500/10 shadow-sm hover:border-orange-500/20 transition-all">
                <Icon name="fire" size={14} className="text-orange-500" />
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-dt-text leading-none">{activeDays}-Day Streak</span>
                  <span className="text-[8px] font-bold text-orange-500/70 tracking-wide uppercase mt-0.5">Momentum</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/40 px-3 py-2 rounded-lg border border-dt-primary/5 shadow-sm hover:border-dt-primary/10 transition-all">
              <Icon name="target" size={14} className="text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-dt-text leading-none">Daily: 2/3</span>
                <span className="text-[8px] font-bold text-emerald-500/70 tracking-wide uppercase mt-0.5">Focus Block</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/40 px-3 py-2 rounded-lg border border-dt-primary/5 shadow-sm hover:border-dt-primary/10 transition-all">
              <Icon name="trophy" size={14} className="text-amber-500" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-dt-text leading-none">{ratingDisplay}</span>
                <span className="text-[8px] font-bold text-amber-500/70 tracking-wide uppercase mt-0.5">Global Rank</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compressed AI Recommendation Panel */}
        <div className="flex-shrink-0 lg:w-64 relative z-10">
          <div className="group/ai relative bg-white/80 backdrop-blur-3xl p-5 rounded-[20px] border border-dt-primary/20 shadow-[0_8px_30px_rgba(124,92,252,0.12)] hover:shadow-[0_12px_40px_rgba(124,92,252,0.2)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-dt-primary/30 to-transparent rounded-full blur-[20px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover/ai:scale-[1.5] transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(124,92,252,0.05),transparent_60%)] pointer-events-none" />

            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-dt-primary/10 to-dt-secondary/10 border border-dt-primary/30 flex items-center justify-center shadow-inner group-hover/ai:scale-110 transition-transform duration-500">
                <Icon name="sparkles" size={16} className="text-dt-primary drop-shadow-[0_0_8px_rgba(124,92,252,0.6)]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-dt-primary uppercase tracking-[0.2em]">Neural Engine</p>
              </div>
            </div>

            <p className="text-[14px] font-black text-dt-text leading-snug relative z-10 tracking-tight">
              Review DP bottom-up patterns.
            </p>
            <p className="text-[11px] font-bold text-dt-textSecondary/80 mt-1.5 relative z-10 opacity-70 group-hover/ai:opacity-100 transition-opacity tracking-wide leading-relaxed">
              High impact expected based on Codeforces algorithmic vectors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
