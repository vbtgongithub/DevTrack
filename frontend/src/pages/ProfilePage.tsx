// ============================================================================
// ProfilePage.tsx — Production-Grade Engineering Identity System
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '../components/layout/PageShell';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { PersonalInfoCard } from '../components/profile/PersonalInfoCard';
import { CareerGoalsCard } from '../components/profile/CareerGoalsCard';
import { CPProfilesCard } from '../components/profile/CPProfilesCard';
import { LeetCodeStatsCard, CodeforcesStatsCard, CodeChefStatsCard, GithubStatsCard } from '../components/profile/PlatformStatsCard';
import { ProfileAchievementsCard } from '../components/profile/ProfileAchievementsCard';
import { SocialProfilesCard } from '../components/profile/SocialProfilesCard';
import { useProfileStore } from '../store/profileStore';
import { useUserStore } from '../store/userStore';
import { useDashboardData } from '../hooks/useDashboardData';
import { Icon } from '../components/shared/Icon';
import '../components/profile/ProfilePage.css';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useUserStore((s) => s.logout);
  const {
    profile,
    leetcode,
    codeforces,
    codechef,
    github,
    syncState,
    syncMessage,
    lastSyncedAt,
    isDirty,
    isSaving,
    isLoading: isProfileLoading,
    fetchProfile,
    saveProfile,
    updateField,
    addTechStack,
    removeTechStack,
    fetchAllPlatforms,
    populateFromDashboard,
  } = useProfileStore();

  const { data: dashboard, loading: dashLoading } = useDashboardData();

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  React.useEffect(() => {
    if (dashboard?.platformStats) {
      populateFromDashboard(dashboard.platformStats, dashboard.githubStats);
    }
  }, [dashboard?.platformStats, dashboard?.githubStats, populateFromDashboard]);

  const totalSolved = React.useMemo(() => {
    let total = 0;
    if (leetcode.data) total += leetcode.data.solvedProblem;
    if (codeforces.data) total += codeforces.data.totalSolved;
    if (codechef.data) total += codechef.data.totalProblemsSolved;
    if (github.data) total += github.data.publicRepos;
    return total;
  }, [leetcode.data, codeforces.data, codechef.data, github.data]);

  const bestRating = React.useMemo(() => {
    const ratings: number[] = [];
    if (leetcode.data?.contestRating) ratings.push(leetcode.data.contestRating);
    if (codeforces.data?.maxRating) ratings.push(codeforces.data.maxRating);
    if (codechef.data?.highestRating) ratings.push(codechef.data.highestRating);
    return ratings.length > 0 ? Math.max(...ratings) : 0;
  }, [leetcode.data, codeforces.data, codechef.data]);

  const handleCancel = () => {
    fetchProfile();
  };

  const hasAnyStats = leetcode.data || codeforces.data || codechef.data || github.data;
  const isLoading = dashLoading || leetcode.loading || codeforces.loading || codechef.loading || github.loading || isProfileLoading;

  // ─── Telemetry Sorting Logic (Increasing Order) ──────────────────────────
  const sortedPlatforms = React.useMemo(() => {
    const platforms = [
      { id: 'leetcode', solved: leetcode.data?.solvedProblem || 0, component: <LeetCodeStatsCard key="lc" state={leetcode} username={profile.leetcodeUsername} /> },
      { id: 'codeforces', solved: codeforces.data?.totalSolved || 0, component: <CodeforcesStatsCard key="cf" state={codeforces} username={profile.codeforcesUsername} /> },
      { id: 'codechef', solved: codechef.data?.totalProblemsSolved || 0, component: <CodeChefStatsCard key="cc" state={codechef} username={profile.codechefUsername} /> },
      { id: 'github', solved: github.data?.publicRepos || 0, component: <GithubStatsCard key="gh" state={github} username={profile.githubUrl.split('/').pop() || ''} /> }
    ];

    // Filter out platforms without data and not loading
    const activePlatforms = platforms.filter(p => {
      const state = p.id === 'leetcode' ? leetcode : p.id === 'codeforces' ? codeforces : p.id === 'codechef' ? codechef : github;
      return state.data || state.loading;
    });

    return activePlatforms.sort((a, b) => a.solved - b.solved);
  }, [leetcode, codeforces, codechef, github, profile]);

  return (
    <div className="profile-page-container">
      <div className="profile-page-glow" />

      <PageShell
        title="Engineering Profile"
        subtitle="Manage your operational identity and platform telemetry"
        status="success"
        error={null}
      >
        <div className="mx-auto w-full max-w-[1000px] profile-content-wrapper">
          <div className="flex flex-col gap-8">
            {/* ─── 1. Identity Panel ───────────────────────────────────── */}
            <ProfileHeader
              fullName={profile.fullName}
              bio={profile.bio}
              totalSolved={totalSolved}
              currentStreak={dashboard?.streak ?? 0}
              bestRating={bestRating}
            />

            {/* ─── 2. Badge Ecosystem ──────────────────────────────────── */}
            <ProfileAchievementsCard />

            {/* ─── 3. Settings Matrix ──────────────────────────────────── */}
            <div className="profile-grid">
              <PersonalInfoCard profile={profile} onUpdate={updateField} />
              <CareerGoalsCard
                profile={profile}
                onUpdate={updateField}
                onAddTech={addTechStack}
                onRemoveTech={removeTechStack}
              />
            </div>

            {/* ─── 4. Connectivity Row ─────────────────────────────────── */}
            <div className="profile-grid">
              <CPProfilesCard
                profile={profile}
                leetcode={leetcode}
                codeforces={codeforces}
                codechef={codechef}
                onUpdate={updateField}
                onFetchAll={fetchAllPlatforms}
                syncState={syncState}
                syncMessage={syncMessage}
                lastSyncedAt={lastSyncedAt}
              />
              <SocialProfilesCard profile={profile} onUpdate={updateField} />
            </div>

            {/* ─── 5. Platform Telemetry (Sorted) ───────────────────────── */}
            {(hasAnyStats || isLoading) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.1em] mb-4 flex items-center gap-2 ml-1">
                  <Icon name="chart-bar" size={14} />
                  Advanced Telemetry Matrix
                </h3>
                <div className="platform-stats-grid">
                  {sortedPlatforms.map(p => p.component)}
                </div>
              </motion.div>
            )}

            {/* ─── 6. Empty State ───────────────────────────────────────── */}
            {!hasAnyStats && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                <Icon name="chart-bar" size={32} className="text-slate-300 mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No telemetry nodes active</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── 7. Global Action Bar (Sticky) ─────────────────────────── */}
        <div className="profile-sticky-footer">
          <motion.div
            className="profile-action-bar"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', damping: 25 }}
          >
            <div className="profile-action-bar__left">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="profile-btn-terminate"
              >
                <Icon name="log-out" size={16} />
                <span>Terminate Session</span>
              </button>
            </div>

            <div className="profile-action-bar__right">
              <AnimatePresence>
                {isDirty && (
                  <motion.button
                    type="button"
                    className="profile-btn-cancel"
                    onClick={handleCancel}
                    disabled={isSaving}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    Discard Changes
                  </motion.button>
                )}
              </AnimatePresence>
              <button
                type="button"
                className="profile-btn-commit"
                onClick={saveProfile}
                disabled={!isDirty || isSaving}
              >
                {isSaving ? 'Syncing...' : 'Commit Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      </PageShell>
    </div>
  );
};

export default ProfilePage;
