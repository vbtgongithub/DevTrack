// ============================================================================
// EnhancedInsightsCard.tsx — AI Insights (Visually Dominant)
// ============================================================================

import React from 'react';
import { Icon } from '../shared/Icon';

export const EnhancedInsightsCard: React.FC = () => {
  // Backend doesn't provide AI insights data yet - show polished empty state

  return (
    <div className="bg-gradient-to-br from-white/60 to-dt-primary/5 backdrop-blur-2xl border border-dt-primary/10 rounded-[32px] p-8 lg:p-10 shadow-[0_8px_40px_rgba(124,92,252,0.05)] relative overflow-hidden group">
      {/* Decorative background blur */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-dt-primary/20 blur-[100px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000 ease-out" />

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[20px] bg-white border border-dt-primary/10 flex items-center justify-center shadow-[0_8px_30px_rgba(124,92,252,0.08)]">
            <Icon name="bolt" size={24} className="text-dt-primary drop-shadow-sm" />
          </div>
          <div>
            <h3 className="text-xl font-black text-dt-text tracking-tighter">AI Synthesis</h3>
            <p className="text-[13px] font-bold text-dt-textSecondary mt-1">Personalized neural recommendations</p>
          </div>
        </div>
        <div className="px-4 py-2 rounded-full bg-dt-primary/10 border border-dt-primary/20 shadow-sm flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dt-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-dt-primary"></span>
          </div>
          <span className="text-[11px] font-black tracking-widest text-dt-primary uppercase">Coming Soon</span>
        </div>
      </div>

      {/* Polished empty state */}
      <div className="flex flex-col items-center justify-center py-12 text-center relative z-10 bg-white/40 rounded-[24px] border border-dt-primary/5 mt-6">
        <div className="relative mb-8 group-hover:-translate-y-2 transition-transform duration-700 cubic-bezier(0.22, 1, 0.36, 1)">
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-white to-dt-primary/5 flex items-center justify-center border border-dt-primary/10 shadow-[0_8px_30px_rgba(124,92,252,0.08)]">
            <Icon name="sparkles" size={40} className="text-dt-primary/40" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center border border-dt-primary/10 shadow-lg">
            <Icon name="clock" size={16} className="text-dt-primary" />
          </div>
        </div>
        <h4 className="text-[20px] font-black text-dt-text mb-3 tracking-tighter">Awaiting Intelligence Signals</h4>
        <p className="text-[15px] text-dt-textSecondary max-w-md mb-10 leading-relaxed font-medium">
          Connect your coding platforms and start solving problems to unlock AI-powered insights and personalized learning paths.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4">
          <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-[16px] border border-dt-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
            <span className="text-[12px] font-black tracking-widest uppercase text-dt-textSecondary/80">LeetCode</span>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-[16px] border border-dt-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
            <span className="text-[12px] font-black tracking-widest uppercase text-dt-textSecondary/80">Codeforces</span>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-[16px] border border-dt-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-[12px] font-black tracking-widest uppercase text-dt-textSecondary/80">GitHub</span>
          </div>
        </div>
      </div>
    </div>
  );
};