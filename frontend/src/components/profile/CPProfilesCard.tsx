// ============================================================================
// CPProfilesCard.tsx — Platform Connectivity Panel
// ============================================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  syncState: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage: string | null;
  lastSyncedAt: string | null;
}

export const CPProfilesCard: React.FC<CPProfilesCardProps> = React.memo(
  ({ profile, leetcode, codeforces, codechef, onUpdate, onFetchAll, syncState, syncMessage, lastSyncedAt }) => {
    const platforms = [
      { key: 'leetcodeUsername' as const, label: 'LeetCode', logo: leetcodeLogo, status: leetcode.loading ? 'loading' : leetcode.error ? 'error' : leetcode.data ? 'connected' : 'idle' },
      { key: 'codeforcesUsername' as const, label: 'Codeforces', logo: codeforcesLogo, status: codeforces.loading ? 'loading' : codeforces.error ? 'error' : codeforces.data ? 'connected' : 'idle' },
      { key: 'codechefUsername' as const, label: 'CodeChef', logo: codechefLogo, status: codechef.loading ? 'loading' : codechef.error ? 'error' : codechef.data ? 'connected' : 'idle' },
    ];

    const isSyncing = syncState === 'syncing';
    const hasAnyUsername = profile.leetcodeUsername.trim() || profile.codeforcesUsername.trim() || profile.codechefUsername.trim();

    return (
      <motion.div
        className="profile-card"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="profile-card__title">
          <div className="profile-card__title-icon">
            <Icon name="link" size={18} />
          </div>
          Node Connectivity
        </h3>

        <div className="flex-1">
          {platforms.map((p) => (
            <div key={p.key} className="cp-platform-row">
              <div className="cp-platform-logo">
                <img src={p.logo} alt={p.label} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.label} Node</span>
                  <div className={`cp-status-badge cp-status-badge--${p.status === 'loading' ? 'idle' : p.status}`}>
                    {p.status}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder={`Enter ${p.label} handle`}
                  value={profile[p.key]}
                  onChange={(e) => onUpdate(p.key, e.target.value)}
                  className="profile-form-input !py-2"
                  disabled={isSyncing}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="cp-fetch-btn w-full flex items-center justify-center gap-2"
            onClick={onFetchAll}
            disabled={isSyncing || !hasAnyUsername}
          >
            <Icon name="arrow-path" size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Synchronizing Node Cluster...' : 'Trigger Platform Sync'}
          </button>

          {lastSyncedAt && !isSyncing && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Icon name="clock" size={12} />
              Last Data Ingestion: {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        <AnimatePresence>
          {syncMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${syncState === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                }`}
            >
              <Icon name={syncState === 'success' ? 'check-circle' : 'exclamation-triangle'} size={14} />
              {syncMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

CPProfilesCard.displayName = 'CPProfilesCard';
