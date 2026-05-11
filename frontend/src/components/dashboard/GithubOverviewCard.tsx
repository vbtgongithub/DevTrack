import React from 'react';
import type { DashboardData } from '../../hooks/useDashboardData';
import githubLogo from '../../assets/logos/github.png';

interface GithubOverviewCardProps {
  data: DashboardData | null;
}

export const GithubOverviewCard: React.FC<GithubOverviewCardProps> = ({ data }) => {
  const ghStats = data?.githubStats;

  if (!ghStats) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-3xl border border-[#10B981]/20 rounded-[32px] p-8 lg:p-10 relative overflow-hidden h-full flex flex-col justify-between group shadow-[0_8px_40px_rgba(16,185,129,0.08)] hover:shadow-[0_16px_60px_rgba(16,185,129,0.12)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
      {/* Accent line and background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-[#34D399]/20 to-[#059669]/20 blur-[100px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.03),transparent_60%)] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-5">
            {ghStats.avatarUrl ? (
              <img
                src={ghStats.avatarUrl}
                alt={ghStats.name || 'GitHub Avatar'}
                className="w-16 h-16 rounded-[20px] border border-[#10B981]/20 object-cover shadow-[0_8px_30px_rgba(16,185,129,0.12)] bg-white relative z-10 transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-16 h-16 rounded-[20px] bg-white flex items-center justify-center border border-[#10B981]/20 shadow-[0_8px_30px_rgba(16,185,129,0.12)] relative z-10 transition-transform duration-500 group-hover:scale-105">
                <img src={githubLogo} alt="GitHub" className="w-8 h-8 opacity-50" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.2em] bg-[#10B981]/10 px-2 py-0.5 rounded-md border border-[#10B981]/20 shadow-inner">Identity System</span>
              </div>
              <h3 className="text-xl font-black text-dt-text tracking-tighter">
                {ghStats.name || 'GitHub Profile'}
              </h3>
              {ghStats.bio && (
                <p className="text-[13px] text-dt-textSecondary mt-0.5 max-w-sm line-clamp-2 leading-relaxed font-bold tracking-wide">
                  {ghStats.bio}
                </p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-black text-dt-textMuted uppercase tracking-widest">
              Synced
            </span>
            <p className="text-[12px] font-bold text-dt-textSecondary mt-1.5 tabular-nums bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-dt-primary/10 shadow-sm">
              {new Date(ghStats.lastSyncedAt).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-5 mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10B981]/5 to-transparent blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-5 flex flex-col items-center justify-center border border-[#10B981]/10 shadow-sm hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:-translate-y-1 hover:border-[#10B981]/30 transition-all duration-500 relative overflow-hidden group/stat">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.05),transparent_50%)] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
            <span className="text-[10px] font-black text-dt-textSecondary/60 uppercase mb-2 tracking-[0.2em] relative z-10">Repos</span>
            <span className="text-3xl font-black text-dt-text tabular-nums tracking-tighter relative z-10 group-hover/stat:scale-105 transition-transform duration-300">{ghStats.repos}</span>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-5 flex flex-col items-center justify-center border border-[#10B981]/10 shadow-sm hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:-translate-y-1 hover:border-[#10B981]/30 transition-all duration-500 relative overflow-hidden group/stat">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.05),transparent_50%)] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
            <span className="text-[10px] font-black text-dt-textSecondary/60 uppercase mb-2 tracking-[0.2em] relative z-10">Followers</span>
            <span className="text-3xl font-black text-dt-text tabular-nums tracking-tighter relative z-10 group-hover/stat:scale-105 transition-transform duration-300">{ghStats.followers}</span>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-5 flex flex-col items-center justify-center border border-[#10B981]/10 shadow-sm hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:-translate-y-1 hover:border-[#10B981]/30 transition-all duration-500 relative overflow-hidden group/stat">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.05),transparent_50%)] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
            <span className="text-[10px] font-black text-dt-textSecondary/60 uppercase mb-2 tracking-[0.2em] relative z-10">Stars</span>
            <span className="text-3xl font-black text-dt-text tabular-nums tracking-tighter relative z-10 group-hover/stat:scale-105 transition-transform duration-300">{ghStats.totalStars}</span>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-5 flex flex-col items-center justify-center border border-[#10B981]/10 shadow-sm hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:-translate-y-1 hover:border-[#10B981]/30 transition-all duration-500 relative overflow-hidden group/stat">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.05),transparent_50%)] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
            <span className="text-[10px] font-black text-dt-textSecondary/60 uppercase mb-2 tracking-[0.2em] relative z-10">Following</span>
            <span className="text-3xl font-black text-dt-text tabular-nums tracking-tighter relative z-10 group-hover/stat:scale-105 transition-transform duration-300">{ghStats.following}</span>
          </div>
        </div>
      </div>

      {ghStats.topLanguages && ghStats.topLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2.5 items-center pt-6 border-t border-[#10B981]/10 mt-auto relative z-10">
          <span className="text-[10px] font-black text-dt-textSecondary/60 uppercase tracking-[0.2em] mr-2">Ecosystem</span>
          {ghStats.topLanguages.slice(0, 5).map((lang, idx) => (
            <span
              key={lang}
              className="px-3.5 py-1.5 text-[11px] font-black bg-[#10B981]/10 text-[#059669] rounded-xl border border-[#10B981]/20 shadow-sm transition-all duration-300 hover:bg-[#10B981] hover:text-white hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(16,185,129,0.3)] cursor-default"
              style={{ animation: `dtFadeIn 300ms ease ${idx * 50}ms both` }}
            >
              {lang}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
