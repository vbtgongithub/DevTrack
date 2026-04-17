// ============================================================================
// CPProfilesCard.tsx — Competitive Programming Platform Usernames
// ============================================================================

import React from 'react';
import type { ProfileData, PlatformState, LeetCodeStats, CodeforcesStats, CodeChefStats } from '../../types/profile.types';
import { Icon } from '../shared/Icon';

import leetcodeLogo from '@/assets/logos/LeetCode.png';
import codeforcesLogo from '@/assets/logos/Codeforces.png';
import codechefLogo from '@/assets/logos/CodeChef.png';

interface CPProfilesCardProps {
  profile: ProfileData;
  leetcode: PlatformState<LeetCodeStats>;
  codeforces: PlatformState<CodeforcesStats>;
  codechef: PlatformState<CodeChefStats>;
  onUpdate: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
  onFetchAll: () => void;
}

type PlatformConfig = {
  key: 'leetcodeUsername' | 'codeforcesUsername' | 'codechefUsername';
  label: string;
  logo: string;
  placeholder: string;
  bgColor: string;
  status: 'connected' | 'loading' | 'error' | 'idle';
};

export const CPProfilesCard: React.FC<CPProfilesCardProps> = React.memo(
  ({ profile, leetcode, codeforces, codechef, onUpdate, onFetchAll }) => {
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
    ];

    const isAnyLoading = leetcode.loading || codeforces.loading || codechef.loading;
    const hasAnyUsername =
      profile.leetcodeUsername.trim() ||
      profile.codeforcesUsername.trim() ||
      profile.codechefUsername.trim();

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
              />
            </div>
            <div className={`cp-status-dot cp-status-dot--${p.status}`} title={p.status} />
          </div>
        ))}

        {/* Error messages */}
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

        <button
          type="button"
          className="cp-fetch-btn"
          onClick={onFetchAll}
          disabled={isAnyLoading || !hasAnyUsername}
        >
          {isAnyLoading ? (
            <>
              <Icon name="arrow-path" size={16} className="text-white" />
              Fetching Stats...
            </>
          ) : (
            <>
              <Icon name="arrow-path" size={16} className="text-white" />
              Fetch Platform Stats
            </>
          )}
        </button>
      </div>
    );
  }
);

CPProfilesCard.displayName = 'CPProfilesCard';
