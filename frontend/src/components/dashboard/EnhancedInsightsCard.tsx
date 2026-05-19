// ============================================================================
// EnhancedInsightsCard.tsx — AI Insights (Visually Dominant)
// ============================================================================

import React from 'react';
import { Icon } from '../shared/Icon';

export const EnhancedInsightsCard: React.FC = () => {
  // Backend doesn't provide AI insights data yet - show polished empty state

  return (
    <div className="bg-white/80 backdrop-blur-3xl border border-gray-200 hover:border-dt-primary/30 rounded-[28px] p-6 shadow-[0_8px_30px_rgba(124,92,252,0.04)] hover:shadow-[0_16px_40px_rgba(124,92,252,0.08)] hover:-translate-y-[2px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden group flex flex-col h-full">
      {/* Subtle animated neural background */}
      <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-1000 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83-42.34 42.34-.83-.83L54.627 0zM24.49 0l.83.83-20.25 20.25-.83-.83L24.49 0zM60 22.84l-20.25 20.25-.83-.83L59.17 22.01l.83.83zM60 52.68l-6.17 6.17-.83-.83L59.17 51.85l.83.83zM33.4 60l-7.98-7.98.83-.83L34.23 60h-.83zM0 33.4l7.98-7.98.83.83L.83 34.23 0 33.4zM0 60l25.32-25.32.83.83L.83 60H0z' fill='%236D4FF2' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-[#7C5CFC]/10 to-[#FF8B94]/10 blur-[80px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6D4FF2]/10 to-[#A78BFA]/10 border border-gray-200 flex items-center justify-center shadow-inner relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(124,92,252,0.15)] transition-shadow duration-500">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent)] mix-blend-overlay opacity-50" />
            <Icon name="sparkles" size={18} className="text-dt-primary drop-shadow-[0_0_8px_rgba(124,92,252,0.6)] relative z-10" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-dt-text tracking-tighter">AI Analysis</h3>
            <p className="text-[11px] font-bold text-dt-textSecondary/80 mt-0.5 tracking-wide">Neural momentum & insights</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-dt-primary/5 border border-dt-primary/10 shadow-[inset_0_1px_2px_rgba(124,92,252,0.05)] flex items-center gap-2">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dt-primary opacity-50"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-dt-primary shadow-[0_0_8px_rgba(124,92,252,0.4)]"></span>
          </div>
          <span className="text-[9px] font-black tracking-[0.15em] text-dt-primary uppercase">Standby</span>
        </div>
      </div>

      {/* Premium AI empty state */}
      <div className="flex flex-col items-center justify-center flex-1 py-8 text-center relative z-10 bg-gradient-to-b from-transparent to-dt-primary/[0.015] rounded-2xl border border-gray-200/50 mt-auto overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />
        
        <div className="relative mb-5 group-hover:-translate-y-1.5 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          {/* Ambient purple radial blur behind the icon */}
          <div className="absolute inset-0 bg-dt-primary rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-700" />
          <div className="w-16 h-16 rounded-full bg-white/60 backdrop-blur-xl flex items-center justify-center border border-dt-primary/15 shadow-[0_8px_30px_rgba(124,92,252,0.08)] relative z-10">
            <div className="absolute inset-1.5 rounded-full border border-dashed border-dt-primary/20 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-0 rounded-full border border-dt-primary/5 animate-ping opacity-20" />
            <Icon name="cube" size={24} className="text-dt-primary/50" />
          </div>
        </div>
        
        <h4 className="text-[15px] font-black text-dt-text mb-2 tracking-tighter drop-shadow-sm">Awaiting Intel</h4>
        <p className="text-[12px] text-dt-textSecondary/70 max-w-[240px] mb-6 leading-relaxed font-bold tracking-wide">
          Connect coding platforms to unlock personalized momentum insights.
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-2 relative z-10">
          <button type="button" className="group/chip flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-slate-50 backdrop-blur-md rounded-lg border border-[#F59E0B]/15 hover:border-[#F59E0B]/30 shadow-sm transition-all duration-300">
            <div className="w-1 h-1 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.5)] group-hover/chip:scale-125 transition-transform" />
            <span className="text-[9px] font-black tracking-[0.1em] uppercase text-dt-textSecondary group-hover/chip:text-dt-text transition-colors">LeetCode</span>
          </button>
          <button type="button" className="group/chip flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-slate-50 backdrop-blur-md rounded-lg border border-[#3B82F6]/15 hover:border-[#3B82F6]/30 shadow-sm transition-all duration-300">
            <div className="w-1 h-1 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.5)] group-hover/chip:scale-125 transition-transform" />
            <span className="text-[9px] font-black tracking-[0.1em] uppercase text-dt-textSecondary group-hover/chip:text-dt-text transition-colors">Codeforces</span>
          </button>
        </div>
      </div>
    </div>
  );
};