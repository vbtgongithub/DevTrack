// ============================================================================
// ProfilePage.tsx — Profile Page
// ============================================================================
// Assembles all profile components. Loads profile editing data from
// localStorage, derives platform stats from GET /api/dashboard (single
// source of truth shared with Dashboard and DSA pages).
// ============================================================================

import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { PersonalInfoCard } from '../components/profile/PersonalInfoCard';
import { CareerGoalsCard } from '../components/profile/CareerGoalsCard';
import { CPProfilesCard } from '../components/profile/CPProfilesCard';
import { LeetCodeStatsCard, CodeforcesStatsCard, CodeChefStatsCard, HackerRankStatsCard, GithubStatsCard } from '../components/profile/PlatformStatsCard';
import { SocialProfilesCard } from '../components/profile/SocialProfilesCard';
import { useProfileStore } from '../store/profileStore';
import { useDashboardData } from '../hooks/useDashboardData';
import { Icon } from '../components/shared/Icon';
import '../components/profile/ProfilePage.css';

const ProfilePage: React.FC = () => {
  const {
    profile,
    leetcode,
    codeforces,
    codechef,
    hackerrank,
    github,
    syncState,
    syncMessage,
    lastSyncedAt,
    isDirty,
    isSaving,
    loadFromStorage,
    saveToStorage,
    updateField,
    addTechStack,
    removeTechStack,
    fetchAllPlatforms,
    populateFromDashboard,
  } = useProfileStore();

  // Single source of truth: GET /api/dashboard
  const { data: dashboard, loading: dashLoading } = useDashboardData();

  const [mounted, setMounted] = React.useState(false);

  // Load profile editing data from localStorage on mount
  React.useEffect(() => {
    loadFromStorage();
    setMounted(true);
  }, [loadFromStorage]);

  // Populate profile platform stats from dashboard data (single source)
  React.useEffect(() => {
    if (dashboard?.platformStats) {
      populateFromDashboard(dashboard.platformStats);
    }
  }, [dashboard?.platformStats, populateFromDashboard]);

  // Compute aggregate stats from platform data
  const totalSolved = React.useMemo(() => {
    let total = 0;
    if (leetcode.data) total += leetcode.data.solvedProblem;
    if (codeforces.data) total += codeforces.data.totalSolved;
    if (codechef.data) total += codechef.data.totalProblemsSolved;
    if (hackerrank.data) total += hackerrank.data.totalSolved;
    return total;
  }, [leetcode.data, codeforces.data, codechef.data, hackerrank.data]);

  const bestRating = React.useMemo(() => {
    const ratings: number[] = [];
    if (leetcode.data?.contestRating) ratings.push(leetcode.data.contestRating);
    if (codeforces.data?.maxRating) ratings.push(codeforces.data.maxRating);
    if (codechef.data?.highestRating) ratings.push(codechef.data.highestRating);
    return ratings.length > 0 ? Math.max(...ratings) : 0;
  }, [leetcode.data, codeforces.data, codechef.data]);

  const handleCancel = () => {
    loadFromStorage(); // Reset to saved state
  };

  const hasAnyStats = leetcode.data || codeforces.data || codechef.data || hackerrank.data || github.data;
  const isLoading = dashLoading || leetcode.loading || codeforces.loading || codechef.loading || hackerrank.loading || github.loading;

  return (
    <div className={['transition-opacity duration-300', mounted ? 'opacity-100' : 'opacity-0'].join(' ')}>
      <PageShell
        title="Profile"
        subtitle="Manage your account and career preferences"
        status="success"
        error={null}
      >
        <div className="mx-auto w-full max-w-[1000px] flex flex-col gap-6">

          {/* ─── 1. Profile Header ───────────────────────────────────── */}
          <ProfileHeader
            fullName={profile.fullName}
            bio={profile.bio}
            totalSolved={totalSolved}
            currentStreak={dashboard?.streak ?? 0}
            bestRating={bestRating}
          />

          {/* ─── 2. Personal Info + Career Goals Row ─────────────────── */}
          <div className="profile-grid">
            <PersonalInfoCard profile={profile} onUpdate={updateField} />
            <CareerGoalsCard
              profile={profile}
              onUpdate={updateField}
              onAddTech={addTechStack}
              onRemoveTech={removeTechStack}
            />
          </div>

          {/* ─── 3. CP Profiles + Social ─────────────────────────────── */}
          <div className="profile-grid">
            <CPProfilesCard
              profile={profile}
              leetcode={leetcode}
              codeforces={codeforces}
              codechef={codechef}
              hackerrank={hackerrank}
              onUpdate={updateField}
              onFetchAll={fetchAllPlatforms}
              syncState={syncState}
              syncMessage={syncMessage}
              lastSyncedAt={lastSyncedAt}
            />
            <SocialProfilesCard profile={profile} onUpdate={updateField} />
          </div>

          {/* ─── 4. Platform Stats ───────────────────────────────────── */}
          {(hasAnyStats || isLoading) && (
            <div>
              <h3 className="text-lg font-bold tracking-tight text-dt-text mb-4 flex items-center gap-2">
                <Icon name="chart-bar" size={18} />
                Platform Statistics
              </h3>
              <div className="platform-stats-grid">
                <LeetCodeStatsCard state={leetcode} username={profile.leetcodeUsername} />
                <CodeforcesStatsCard state={codeforces} username={profile.codeforcesUsername} />
                <CodeChefStatsCard state={codechef} username={profile.codechefUsername} />
                <HackerRankStatsCard state={hackerrank} username={profile.hackerrankUsername} />
                <GithubStatsCard state={github} username={profile.githubUrl.split('/').pop() || ''} />
              </div>
            </div>
          )}

          {/* ─── 5. Empty State ───────────────────────────────────────── */}
          {!hasAnyStats && !isLoading && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
              <Icon name="chart-bar" size={24} />
              <p style={{ marginTop: '0.5rem' }}>No data available. Please sync your platforms.</p>
            </div>
          )}

          {/* ─── 6. Save / Cancel ────────────────────────────────────── */}
          <div className="profile-save-row">
            <button
              type="button"
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={!isDirty}
            >
              Cancel
            </button>
            <button
              type="button"
              className="profile-save-btn"
              onClick={saveToStorage}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default ProfilePage;
