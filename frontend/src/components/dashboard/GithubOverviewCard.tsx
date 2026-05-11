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
    <div className="bg-white/40 backdrop-blur-2xl border border-dt-primary/10 rounded-[32px] p-8 lg:p-10 relative overflow-hidden h-full flex flex-col justify-between group shadow-[0_8px_40px_rgba(124,92,252,0.05)] hover:shadow-[0_12px_50px_rgba(124,92,252,0.08)] transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1)">
      {/* Accent line and background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-dt-primary/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-dt-primary/20 transition-colors duration-1000 ease-out" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-5">
            {ghStats.avatarUrl ? (
              <img
                src={ghStats.avatarUrl}
                alt={ghStats.name || 'GitHub Avatar'}
                className="w-16 h-16 rounded-[20px] border border-dt-primary/10 object-cover shadow-[0_8px_30px_rgba(124,92,252,0.08)] bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-[20px] bg-white flex items-center justify-center border border-dt-primary/10 shadow-[0_8px_30px_rgba(124,92,252,0.08)]">
                <img src={githubLogo} alt="GitHub" className="w-8 h-8 opacity-50" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-black text-dt-text tracking-tighter">
                {ghStats.name || 'GitHub Profile'}
              </h3>
              {ghStats.bio && (
                <p className="text-[13px] text-dt-textSecondary mt-1 max-w-sm line-clamp-2 leading-relaxed font-bold">
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-5 mb-8">
          <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-5 flex flex-col items-center justify-center border border-dt-primary/10 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-dt-primary/30 transition-all duration-300">
            <span className="text-[11px] font-black text-dt-textSecondary/60 uppercase mb-2 tracking-widest">Repos</span>
            <span className="text-3xl font-black text-dt-text tabular-nums tracking-tighter">{ghStats.repos}</span>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-5 flex flex-col items-center justify-center border border-dt-primary/10 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-dt-primary/30 transition-all duration-300">
            <span className="text-[11px] font-black text-dt-textSecondary/60 uppercase mb-2 tracking-widest">Followers</span>
            <span className="text-3xl font-black text-dt-text tabular-nums tracking-tighter">{ghStats.followers}</span>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-5 flex flex-col items-center justify-center border border-dt-primary/10 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-dt-primary/30 transition-all duration-300">
            <span className="text-[11px] font-black text-dt-textSecondary/60 uppercase mb-2 tracking-widest">Stars</span>
            <span className="text-3xl font-black text-dt-text tabular-nums tracking-tighter">{ghStats.totalStars}</span>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-5 flex flex-col items-center justify-center border border-dt-primary/10 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-dt-primary/30 transition-all duration-300">
            <span className="text-[11px] font-black text-dt-textSecondary/60 uppercase mb-2 tracking-widest">Following</span>
            <span className="text-3xl font-black text-dt-text tabular-nums tracking-tighter">{ghStats.following}</span>
          </div>
        </div>
      </div>

      {ghStats.topLanguages && ghStats.topLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center pt-6 border-t border-dt-primary/10 mt-auto relative z-10">
          <span className="text-[11px] font-black text-dt-textSecondary/60 uppercase tracking-widest mr-2">Core Stack</span>
          {ghStats.topLanguages.slice(0, 5).map((lang) => (
            <span
              key={lang}
              className="px-3 py-1.5 text-[11px] font-black bg-dt-primary/10 text-dt-primary rounded-xl border border-dt-primary/20 shadow-sm transition-colors hover:bg-dt-primary/20"
            >
              {lang}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
