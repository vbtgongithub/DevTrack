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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {ghStats.avatarUrl ? (
            <img 
              src={ghStats.avatarUrl} 
              alt={ghStats.name || 'GitHub Avatar'} 
              className="w-16 h-16 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <img src={githubLogo} alt="GitHub" className="w-8 h-8 opacity-50" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {ghStats.name || 'GitHub Profile'}
            </h3>
            {ghStats.bio && (
              <p className="text-sm text-gray-500 mt-1 max-w-md line-clamp-2">
                {ghStats.bio}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Last Synced
          </span>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(ghStats.lastSyncedAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase mb-1">Repositories</span>
          <span className="text-2xl font-bold text-gray-900">{ghStats.repos}</span>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase mb-1">Followers</span>
          <span className="text-2xl font-bold text-gray-900">{ghStats.followers}</span>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase mb-1">Stars</span>
          <span className="text-2xl font-bold text-gray-900">{ghStats.totalStars}</span>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase mb-1">Following</span>
          <span className="text-2xl font-bold text-gray-900">{ghStats.following}</span>
        </div>
      </div>

      {ghStats.topLanguages && ghStats.topLanguages.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Top Languages:</span>
          {ghStats.topLanguages.slice(0, 5).map((lang) => (
            <span
              key={lang}
              className="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full border border-purple-100"
            >
              {lang}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
