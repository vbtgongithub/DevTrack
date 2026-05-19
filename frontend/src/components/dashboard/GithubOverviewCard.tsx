
import type { DashboardData } from '../../hooks/useDashboardData';
import { useNavigate } from 'react-router-dom';
import githubLogo from '../../assets/logos/github.png';

interface GithubOverviewCardProps {
  data: DashboardData | null;
}

export const GithubOverviewCard = ({ data }: GithubOverviewCardProps) => {
  const navigate = useNavigate();
  const ghStats = data?.githubStats;

  if (!ghStats) {
    return (
      <div className="bg-white/80 backdrop-blur-3xl border border-gray-300 rounded-[32px] p-8 lg:p-10 relative overflow-hidden shadow-[0_8px_40px_rgba(124,92,252,0.06)] hover:border-dt-primary/30 hover:shadow-lg transition-all duration-500">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-dt-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-center items-center h-full">
          <div className="w-16 h-16 rounded-[20px] bg-dt-bg flex items-center justify-center border border-dt-primary/10 shadow-sm mb-4">
            <img src={githubLogo} alt="GitHub" className="w-8 h-8 opacity-40" />
          </div>
          <h3 className="text-xl font-black text-dt-text tracking-tighter">GitHub Identity</h3>
          <p className="text-[13px] text-dt-textSecondary mt-2 mb-6 font-bold text-center">Connect your GitHub account to sync your developer profile</p>
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-dt-primary to-dt-secondary text-white font-bold text-[14px] shadow-dt-glow hover:shadow-dt-card-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            Connect GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-3xl border border-gray-200 rounded-[28px] p-6 relative overflow-hidden h-full flex flex-col group shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:border-slate-800/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
      {/* Accent line and background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-slate-400/10 to-slate-800/10 blur-[80px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.02),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        
        <div className="flex flex-col flex-1 justify-between">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {ghStats.avatarUrl ? (
                <img
                  src={ghStats.avatarUrl}
                  alt={ghStats.name || 'GitHub Avatar'}
                  className="w-12 h-12 rounded-[14px] border border-[#10B981]/20 object-cover shadow-[0_4px_15px_rgba(16,185,129,0.1)] bg-white relative z-10 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center border border-[#10B981]/20 shadow-[0_4px_15px_rgba(16,185,129,0.1)] relative z-10 transition-transform duration-500 group-hover:scale-105">
                  <img src={githubLogo} alt="GitHub" className="w-6 h-6 opacity-50" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-black text-[#10B981] uppercase tracking-[0.15em] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20 shadow-inner">Identity</span>
                </div>
                <h3 className="text-[16px] font-black text-dt-text tracking-tighter">
                  {ghStats.name || 'GitHub Profile'}
                </h3>
                {ghStats.bio && (
                  <p className="text-[11px] text-dt-textSecondary/80 mt-0.5 max-w-sm line-clamp-1 leading-relaxed font-bold tracking-wide">
                    {ghStats.bio}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] font-black text-dt-textMuted uppercase tracking-widest">
                Synced
              </span>
              <p className="text-[10px] font-bold text-dt-textSecondary mt-1 tabular-nums bg-white/60 backdrop-blur-md px-2 py-1 rounded border border-gray-200 shadow-sm">
                {ghStats.lastSyncedAt 
                  ? new Date(ghStats.lastSyncedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : 'Today'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 relative flex-1 items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/5 to-transparent blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-200/50 shadow-sm hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-slate-800/20 transition-all duration-500 relative overflow-hidden group/stat">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.03),transparent_50%)] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
              <span className="text-[9px] font-black text-dt-textSecondary/70 uppercase mb-1.5 tracking-[0.1em] relative z-10">Repos</span>
              <span className="text-2xl lg:text-[28px] font-black text-dt-text tabular-nums tracking-tighter relative z-10 group-hover/stat:scale-105 transition-transform duration-300">{ghStats.repos || 0}</span>
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-200/50 shadow-sm hover:shadow-[0_8px_20px_rgba(16,185,129,0.08)] hover:-translate-y-0.5 hover:border-[#10B981]/20 transition-all duration-500 relative overflow-hidden group/stat">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.04),transparent_50%)] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
              <span className="text-[9px] font-black text-dt-textSecondary/70 uppercase mb-1.5 tracking-[0.1em] relative z-10">Followers</span>
              <span className="text-2xl lg:text-[28px] font-black text-dt-text tabular-nums tracking-tighter relative z-10 group-hover/stat:scale-105 transition-transform duration-300">{ghStats.followers || 0}</span>
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-200/50 shadow-sm hover:shadow-[0_8px_20px_rgba(16,185,129,0.08)] hover:-translate-y-0.5 hover:border-[#10B981]/20 transition-all duration-500 relative overflow-hidden group/stat">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.04),transparent_50%)] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
              <span className="text-[9px] font-black text-dt-textSecondary/70 uppercase mb-1.5 tracking-[0.1em] relative z-10">Stars</span>
              <span className="text-2xl lg:text-[28px] font-black text-dt-text tabular-nums tracking-tighter relative z-10 group-hover/stat:scale-105 transition-transform duration-300">{ghStats.totalStars || 0}</span>
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-200/50 shadow-sm hover:shadow-[0_8px_20px_rgba(16,185,129,0.08)] hover:-translate-y-0.5 hover:border-[#10B981]/20 transition-all duration-500 relative overflow-hidden group/stat">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.04),transparent_50%)] opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
              <span className="text-[9px] font-black text-dt-textSecondary/70 uppercase mb-1.5 tracking-[0.1em] relative z-10">Following</span>
              <span className="text-2xl lg:text-[28px] font-black text-dt-text tabular-nums tracking-tighter relative z-10 group-hover/stat:scale-105 transition-transform duration-300">{ghStats.following || 0}</span>
            </div>
          </div>

          {ghStats.topLanguages && ghStats.topLanguages.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-[#10B981]/10 mt-auto relative z-10">
              <span className="text-[9px] font-black text-dt-textSecondary/60 uppercase tracking-[0.15em] mr-1">Ecosystem</span>
              {ghStats.topLanguages.slice(0, 5).map((lang) => (
                <span
                  key={lang}
                  className="px-2.5 py-1 text-[10px] font-black bg-[#10B981]/10 text-[#059669] rounded-lg border border-[#10B981]/20 shadow-sm transition-all duration-300 hover:bg-[#10B981] hover:text-white hover:-translate-y-[1px] hover:shadow-[0_4px_10px_rgba(16,185,129,0.2)] cursor-default"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
