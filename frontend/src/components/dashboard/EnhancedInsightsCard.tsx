// ============================================================================
// EnhancedInsightsCard.tsx — AI Insights (Visually Dominant)
// ============================================================================

import React from 'react';
import { Icon } from '../shared/Icon';

export const EnhancedInsightsCard: React.FC = () => {
  // Backend doesn't provide AI insights data yet - show polished empty state

  return (
    <div className="bg-white/80 backdrop-blur-3xl border border-gray-300 hover:border-dt-primary/30 rounded-[32px] p-8 lg:p-10 shadow-[0_8px_40px_rgba(124,92,252,0.06)] hover:shadow-[0_16px_60px_rgba(124,92,252,0.12)] hover:-translate-y-[2px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden group">
      {/* Subtle animated neural background */}
      <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83-42.34 42.34-.83-.83L54.627 0zM24.49 0l.83.83-20.25 20.25-.83-.83L24.49 0zM60 22.84l-20.25 20.25-.83-.83L59.17 22.01l.83.83zM60 52.68l-6.17 6.17-.83-.83L59.17 51.85l.83.83zM33.4 60l-7.98-7.98.83-.83L34.23 60h-.83zM0 33.4l7.98-7.98.83.83L.83 34.23 0 33.4zM0 60l25.32-25.32.83.83L.83 60H0z' fill='%236D4FF2' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-[#7C5CFC]/20 to-[#FF8B94]/20 blur-[100px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#6D4FF2]/10 to-[#A78BFA]/10 border border-gray-300 flex items-center justify-center shadow-inner relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent)] mix-blend-overlay opacity-50" />
            <Icon name="sparkles" size={24} className="text-dt-primary drop-shadow-[0_0_8px_rgba(124,92,252,0.6)] relative z-10" />
          </div>
          <div>
            <h3 className="text-xl font-black text-dt-text tracking-tighter">AI Engineering Insights</h3>
            <p className="text-[13px] font-bold text-dt-textSecondary mt-1 tracking-wide">Neural analysis & momentum</p>
          </div>
        </div>
        <div className="px-4 py-2 rounded-full bg-dt-primary/5 border border-gray-300 shadow-[inset_0_1px_2px_rgba(124,92,252,0.1)] flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dt-primary opacity-50"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-dt-primary shadow-[0_0_8px_rgba(124,92,252,0.4)]"></span>
          </div>
          <span className="text-[10px] font-black tracking-[0.2em] text-dt-primary uppercase">Initializing</span>
        </div>
      </div>

      {/* Premium AI empty state */}
      <div className="flex flex-col items-center justify-center py-14 text-center relative z-10 bg-gradient-to-b from-transparent to-dt-primary/[0.02] rounded-[24px] border border-gray-300 mt-6 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="relative mb-8 group-hover:-translate-y-2 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="w-24 h-24 rounded-full bg-white/50 backdrop-blur-xl flex items-center justify-center border border-dt-primary/20 shadow-[0_8px_40px_rgba(124,92,252,0.12)] relative z-10">
            <div className="absolute inset-2 rounded-full border border-dashed border-dt-primary/30 animate-[spin_20s_linear_infinite]" />
            <Icon name="cube" size={32} className="text-dt-primary/60" />
          </div>
        </div>
        
        <h4 className="text-[22px] font-black text-dt-text mb-3 tracking-tighter drop-shadow-sm">Awaiting Intelligence Signals</h4>
        <p className="text-[14px] text-dt-textSecondary/80 max-w-sm mb-10 leading-relaxed font-bold tracking-wide">
          Connect your coding platforms to unlock AI-powered weakness analysis and personalized momentum insights.
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl border border-[#F59E0B]/20 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-dt-textSecondary">LeetCode</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl border border-[#3B82F6]/20 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-dt-textSecondary">Codeforces</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl border border-[#10B981]/20 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-dt-textSecondary">GitHub</span>
          </div>
        </div>
      </div>
    </div>
  );
};