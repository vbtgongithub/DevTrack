// ============================================================================
// PlatformStatsCard.tsx — Individual Platform Stats Display
// ============================================================================

import React from 'react';
import type { LeetCodeStats, CodeforcesStats, CodeChefStats, HackerRankStats, GithubStats, PlatformState } from '../../types/profile.types';

import leetcodeLogo from '@/assets/logos/LeetCode.png';
import codeforcesLogo from '@/assets/logos/Codeforces.png';
import codechefLogo from '@/assets/logos/CodeChef.png';
import hackerrankLogo from '@/assets/logos/HackerRank.png';

// ---------------------------------------------------------------------------
// Helper: get Codeforces rank color
// ---------------------------------------------------------------------------
function cfRankColor(rank: string): string {
  const r = rank.toLowerCase();
  if (r.includes('legendary') || r.includes('tourist')) return '#ff0000';
  if (r.includes('international grandmaster')) return '#ff0000';
  if (r.includes('grandmaster')) return '#ff0000';
  if (r.includes('international master')) return '#ff8c00';
  if (r.includes('master')) return '#ff8c00';
  if (r.includes('candidate master')) return '#aa00aa';
  if (r.includes('expert')) return '#0000ff';
  if (r.includes('specialist')) return '#03a89e';
  if (r.includes('pupil')) return '#008000';
  if (r.includes('newbie')) return '#808080';
  return '#6b7280';
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------
const StatsSkeleton: React.FC = () => (
  <div className="platform-loading-skeleton">
    <div className="platform-loading-skeleton__bar" style={{ width: '60%' }} />
    <div className="platform-loading-skeleton__bar" style={{ width: '80%' }} />
    <div className="platform-loading-skeleton__bar" style={{ width: '45%' }} />
    <div className="platform-loading-skeleton__bar" style={{ width: '70%' }} />
    <div className="platform-loading-skeleton__bar" style={{ width: '55%' }} />
  </div>
);

// ---------------------------------------------------------------------------
// Difficulty Bar
// ---------------------------------------------------------------------------
const DifficultyBar: React.FC<{
  label: string;
  solved: number;
  total: number;
  variant: 'easy' | 'medium' | 'hard';
}> = ({ label, solved, total, variant }) => {
  const pct = total > 0 ? Math.min((solved / total) * 100, 100) : 0;
  return (
    <div className="difficulty-bar__row">
      <span className={`difficulty-bar__label difficulty-bar__label--${variant}`}>{label}</span>
      <div className="difficulty-bar__track">
        <div
          className={`difficulty-bar__fill difficulty-bar__fill--${variant}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="difficulty-bar__count">{solved}/{total}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// LeetCode Card
// ---------------------------------------------------------------------------
export const LeetCodeStatsCard: React.FC<{ state: PlatformState<LeetCodeStats>; username: string }> = React.memo(
  ({ state, username }) => {
    if (!state.data && !state.loading) return null;

    return (
      <div className="platform-stats-card platform-stats-card--leetcode">
        <div className="platform-stats-card__header">
          <div className="platform-stats-card__header-left">
            <img src={leetcodeLogo} alt="LeetCode" style={{ width: 24, height: 24 }} />
            <div>
              <div className="platform-stats-card__name">LeetCode</div>
              <div className="platform-stats-card__username">@{username}</div>
            </div>
          </div>
          {state.data && state.data.contestRating > 0 && (
            <span
              className="platform-stats-card__rating-badge"
              style={{ background: '#fff7ed', color: '#ea580c' }}
            >
              {state.data.contestRating} Rating
            </span>
          )}
        </div>

        {state.loading ? (
          <StatsSkeleton />
        ) : state.data ? (
          <>
            <div className="platform-stats-card__stats-grid">
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Total Solved</div>
                <div className="platform-stat-item__value">{state.data.solvedProblem}</div>
              </div>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Contests</div>
                <div className="platform-stat-item__value">{state.data.totalContests || '—'}</div>
              </div>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Global Rank</div>
                <div className="platform-stat-item__value">
                  {state.data.contestGlobalRanking
                    ? `#${state.data.contestGlobalRanking.toLocaleString()}`
                    : '—'}
                </div>
              </div>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Top %</div>
                <div className="platform-stat-item__value">
                  {state.data.contestTopPercentage
                    ? `${state.data.contestTopPercentage.toFixed(1)}%`
                    : '—'}
                </div>
              </div>
            </div>

            <div className="difficulty-bar" style={{ marginTop: 16 }}>
              <DifficultyBar label="Easy" solved={state.data.easySolved} total={state.data.totalEasy} variant="easy" />
              <DifficultyBar label="Medium" solved={state.data.mediumSolved} total={state.data.totalMedium} variant="medium" />
              <DifficultyBar label="Hard" solved={state.data.hardSolved} total={state.data.totalHard} variant="hard" />
            </div>
          </>
        ) : null}
      </div>
    );
  }
);

LeetCodeStatsCard.displayName = 'LeetCodeStatsCard';

// ---------------------------------------------------------------------------
// Codeforces Card
// ---------------------------------------------------------------------------
export const CodeforcesStatsCard: React.FC<{ state: PlatformState<CodeforcesStats>; username: string }> = React.memo(
  ({ state, username }) => {
    if (!state.data && !state.loading) return null;

    const rankColor = state.data ? cfRankColor(state.data.rank) : '#6b7280';

    return (
      <div className="platform-stats-card platform-stats-card--codeforces">
        <div className="platform-stats-card__header">
          <div className="platform-stats-card__header-left">
            <img src={codeforcesLogo} alt="Codeforces" style={{ width: 24, height: 24 }} />
            <div>
              <div className="platform-stats-card__name">Codeforces</div>
              <div className="platform-stats-card__username">@{username}</div>
            </div>
          </div>
          {state.data && state.data.rating > 0 && (
            <span
              className="platform-stats-card__rating-badge"
              style={{ background: `${rankColor}15`, color: rankColor }}
            >
              {state.data.rating} Rating
            </span>
          )}
        </div>

        {state.loading ? (
          <StatsSkeleton />
        ) : state.data ? (
          <>
            <div className="platform-stats-card__stats-grid">
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Total Solved</div>
                <div className="platform-stat-item__value">{state.data.totalSolved}</div>
              </div>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Contests</div>
                <div className="platform-stat-item__value">{state.data.totalContests || '—'}</div>
              </div>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Rating</div>
                <div className="platform-stat-item__value" style={{ color: rankColor }}>
                  {state.data.rating || 'Unrated'}
                </div>
              </div>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Rank</div>
                <div className="platform-stat-item__value" style={{ fontSize: 14, color: rankColor }}>
                  {state.data.rank.charAt(0).toUpperCase() + state.data.rank.slice(1)}
                </div>
              </div>
            </div>

            <div className="platform-stats-card__stats-grid" style={{ marginTop: 12 }}>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Max Rating</div>
                <div className="platform-stat-item__value">{state.data.maxRating || '—'}</div>
              </div>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Max Rank</div>
                <div className="platform-stat-item__value" style={{ fontSize: 14 }}>
                  {state.data.maxRank.charAt(0).toUpperCase() + state.data.maxRank.slice(1)}
                </div>
              </div>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Contribution</div>
                <div className="platform-stat-item__value" style={{ color: state.data.contribution >= 0 ? '#10b981' : '#ef4444' }}>
                  {state.data.contribution > 0 ? '+' : ''}{state.data.contribution}
                </div>
              </div>
              <div className="platform-stat-item">
                <div className="platform-stat-item__label">Friend Of</div>
                <div className="platform-stat-item__value">{state.data.friendOfCount.toLocaleString()}</div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }
);

CodeforcesStatsCard.displayName = 'CodeforcesStatsCard';

// ---------------------------------------------------------------------------
// CodeChef Card
// ---------------------------------------------------------------------------
export const CodeChefStatsCard: React.FC<{ state: PlatformState<CodeChefStats>; username: string }> = React.memo(
  ({ state, username }) => {
    if (!state.data && !state.loading) return null;

    return (
      <div className="platform-stats-card platform-stats-card--codechef">
        <div className="platform-stats-card__header">
          <div className="platform-stats-card__header-left">
            <img src={codechefLogo} alt="CodeChef" style={{ width: 24, height: 24 }} />
            <div>
              <div className="platform-stats-card__name">CodeChef</div>
              <div className="platform-stats-card__username">@{username}</div>
            </div>
          </div>
          {state.data && state.data.currentRating > 0 && (
            <span
              className="platform-stats-card__rating-badge"
              style={{ background: '#faf5f0', color: '#795548' }}
            >
              {state.data.stars}
            </span>
          )}
        </div>

        {state.loading ? (
          <StatsSkeleton />
        ) : state.data ? (
          <div className="platform-stats-card__stats-grid">
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Rating</div>
              <div className="platform-stat-item__value">{state.data.currentRating || '—'}</div>
            </div>
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Highest Rating</div>
              <div className="platform-stat-item__value">{state.data.highestRating || '—'}</div>
            </div>
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Global Rank</div>
              <div className="platform-stat-item__value">
                {state.data.globalRank ? `#${state.data.globalRank.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Problems Solved</div>
              <div className="platform-stat-item__value">{state.data.totalProblemsSolved || '—'}</div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

CodeChefStatsCard.displayName = 'CodeChefStatsCard';

// ---------------------------------------------------------------------------
// HackerRank Card
// ---------------------------------------------------------------------------
export const HackerRankStatsCard: React.FC<{ state: PlatformState<HackerRankStats>; username: string }> = React.memo(
  ({ state, username }) => {
    if (!state.data && !state.loading) return null;

    return (
      <div className="platform-stats-card platform-stats-card--hackerrank">
        <div className="platform-stats-card__header">
          <div className="platform-stats-card__header-left">
            <img src={hackerrankLogo} alt="HackerRank" style={{ width: 24, height: 24 }} />
            <div>
              <div className="platform-stats-card__name">HackerRank</div>
              <div className="platform-stats-card__username">@{username}</div>
            </div>
          </div>
          {state.data && state.data.score > 0 && (
            <span
              className="platform-stats-card__rating-badge"
              style={{ background: '#e6fef0', color: '#00c853' }}
            >
              {state.data.score} Score
            </span>
          )}
        </div>

        {state.loading ? (
          <StatsSkeleton />
        ) : state.data ? (
          <div className="platform-stats-card__stats-grid">
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Total Solved</div>
              <div className="platform-stat-item__value">{state.data.totalSolved}</div>
            </div>
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Contests</div>
              <div className="platform-stat-item__value">{state.data.totalContests || '—'}</div>
            </div>
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Badges</div>
              <div className="platform-stat-item__value">{state.data.badges || '—'}</div>
            </div>
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Certificates</div>
              <div className="platform-stat-item__value">{state.data.certificates || '—'}</div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

export const GithubStatsCard: React.FC<{ state: PlatformState<GithubStats>; username: string }> = React.memo(
  ({ state, username }) => {
    if (!state.data && !state.loading) return null;

    return (
      <div className="platform-stats-card platform-stats-card--github">
        <div className="platform-stats-card__header">
          <div className="platform-stats-card__header-left">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 shrink-0">
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <div>
              <div className="platform-stats-card__name">GitHub</div>
              <div className="platform-stats-card__username">@{username}</div>
            </div>
          </div>
        </div>

        {state.loading ? (
          <StatsSkeleton />
        ) : state.data ? (
          <div className="platform-stats-card__stats-grid">
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Public Repos</div>
              <div className="platform-stat-item__value">{state.data.publicRepos}</div>
            </div>
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Followers</div>
              <div className="platform-stat-item__value">{state.data.followers}</div>
            </div>
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Following</div>
              <div className="platform-stat-item__value">{state.data.following}</div>
            </div>
            <div className="platform-stat-item">
              <div className="platform-stat-item__label">Created</div>
              <div className="platform-stat-item__value" style={{ fontSize: 11 }}>
                {state.data.createdAt ? new Date(state.data.createdAt).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

GithubStatsCard.displayName = 'GithubStatsCard';
