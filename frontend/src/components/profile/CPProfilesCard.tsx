// ============================================================================
// CPProfilesCard.tsx — Competitive Programming Platform Usernames
// ============================================================================
// Shows platform username inputs, a "Sync Now" button that calls the backend,
// and displays sync lifecycle state (loading/success/error + last synced time).
// ============================================================================

import React from 'react';
import type { ProfileData, PlatformState, LeetCodeStats, CodeforcesStats, CodeChefStats, HackerRankStats } from '../../types/profile.types';
import { Icon } from '../shared/Icon';

import leetcodeLogo from '@/assets/logos/LeetCode.png';
import codeforcesLogo from '@/assets/logos/Codeforces.png';
import codechefLogo from '@/assets/logos/CodeChef.png';
import hackerrankLogo from '@/assets/logos/HackerRank.png';

interface CPProfilesCardProps {
  profile: ProfileData;
  leetcode: PlatformState<LeetCodeStats>;
  codeforces: PlatformState<CodeforcesStats>;
  codechef: PlatformState<CodeChefStats>;
  hackerrank: PlatformState<HackerRankStats>;
  onUpdate: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
  onFetchAll: () => void;
  // Sync lifecycle props
  syncState: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage: string | null;
  lastSyncedAt: string | null;
}

type PlatformConfig = {
  key: 'leetcodeUsername' | 'codeforcesUsername' | 'codechefUsername' | 'hackerrankUsername';
  label: string;
  logo: string;
  placeholder: string;
  bgColor: string;
  status: 'connected' | 'loading' | 'error' | 'idle';
};

/** Format ISO date to a human-readable "last synced" string */
function formatLastSynced(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const CPProfilesCard: React.FC<CPProfilesCardProps> = React.memo(
  ({ profile, leetcode, codeforces, codechef, hackerrank, onUpdate, onFetchAll, syncState, syncMessage, lastSyncedAt }) => {
    const platforms: PlatformConfig[] = [
      {
        key: 'leetcodeUsername',
        label: 'LeetCode',
        logo: leetcodeLogo,
        placeholder: 'e.g. leetcode_user',
        bgColor: '#fff7ed',
        status: leetcode.loading ? 'loading' : leetcode.error ? 'error' : leetcode.data ? 'connected' : 'idle',
      },
      {
        key: 'codeforcesUsername',
        label: 'Codeforces',
        logo: codeforcesLogo,
        placeholder: 'e.g. tourist',
        bgColor: '#eff6ff',
        status: codeforces.loading ? 'loading' : codeforces.error ? 'error' : codeforces.data ? 'connected' : 'idle',
      },
      {
        key: 'codechefUsername',
        label: 'CodeChef',
        logo: codechefLogo,
        placeholder: 'e.g. codechef_user',
        bgColor: '#faf5f0',
        status: codechef.loading ? 'loading' : codechef.error ? 'error' : codechef.data ? 'connected' : 'idle',
      },
      {
        key: 'hackerrankUsername',
        label: 'HackerRank',
        logo: hackerrankLogo,
        placeholder: 'e.g. hackerrank_user',
        bgColor: '#e6fef0',
        status: hackerrank.loading ? 'loading' : hackerrank.error ? 'error' : hackerrank.data ? 'connected' : 'idle',
      },
    ];

    const isSyncing = syncState === 'syncing';
    const hasAnyUsername =
      profile.leetcodeUsername.trim() ||
      profile.codeforcesUsername.trim() ||
      profile.codechefUsername.trim() ||
      profile.hackerrankUsername.trim();

    return (
      <div className="profile-card">
        <h3 className="profile-card__title">
          <span className="profile-card__title-icon" style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
            <Icon name="code-bracket" size={14} color="#3b82f6" />
          </span>
          Competitive Programming Profiles
        </h3>

        {platforms.map((p) => (
          <div key={p.key} className="cp-platform-row">
            <div className="cp-platform-logo" style={{ background: p.bgColor }}>
              <img src={p.logo} alt={p.label} />
            </div>
            <div className="cp-platform-input">
              <input
                type="text"
                placeholder={p.placeholder}
                value={profile[p.key]}
                onChange={(e) => onUpdate(p.key, e.target.value)}
                aria-label={`${p.label} username`}
                disabled={isSyncing}
              />
            </div>
            <div className={`cp-status-dot cp-status-dot--${p.status}`} title={p.status} />
          </div>
        ))}

        {/* Per-platform error messages */}
        {leetcode.error && (
          <div className="platform-error">
            <Icon name="exclamation-triangle" size={14} />
            <span>LeetCode: {leetcode.error}</span>
          </div>
        )}
        {codeforces.error && (
          <div className="platform-error">
            <Icon name="exclamation-triangle" size={14} />
            <span>Codeforces: {codeforces.error}</span>
          </div>
        )}
        {codechef.error && (
          <div className="platform-error">
            <Icon name="exclamation-triangle" size={14} />
            <span>CodeChef: {codechef.error}</span>
          </div>
        )}
        {hackerrank.error && (
          <div className="platform-error">
            <Icon name="exclamation-triangle" size={14} />
            <span>HackerRank: {hackerrank.error}</span>
          </div>
        )}

        {/* Sync result feedback */}
        {syncMessage && (
          <div
            className="platform-error"
            style={{
              color: syncState === 'success' ? '#16a34a' : '#dc2626',
              background: syncState === 'success' ? '#f0fdf4' : '#fef2f2',
              borderColor: syncState === 'success' ? '#bbf7d0' : '#fecaca',
            }}
          >
            <Icon
              name={syncState === 'success' ? 'check-circle' : 'exclamation-triangle'}
              size={14}
            />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Last synced time */}
        {lastSyncedAt && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icon name="clock" size={12} />
            Last synced: {formatLastSynced(lastSyncedAt)}
          </div>
        )}

        {/* Sync Now button */}
        <button
          type="button"
          className="cp-fetch-btn"
          onClick={onFetchAll}
          disabled={isSyncing || !hasAnyUsername}
        >
          {isSyncing ? (
            <>
              <Icon name="arrow-path" size={16} className="text-white animate-spin" />
              Syncing Platforms...
            </>
          ) : (
            <>
              <Icon name="arrow-path" size={16} className="text-white" />
              Sync Now
            </>
          )}
        </button>
      </div>
    );
  }
);

CPProfilesCard.displayName = 'CPProfilesCard';
