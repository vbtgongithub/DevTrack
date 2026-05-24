import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchDsaContests } from '../services/dsaService';
import { useUserStore } from '../store/userStore';
import { type ApiDsaContestEntry } from '../types/api.types';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { EnhancedInsightsCard } from '../components/dashboard/EnhancedInsightsCard';
import { ProgressCards } from '../components/dashboard/ProgressCards';
import { AnnouncementSection } from '../components/dashboard/AnnouncementSection';
import { ActionsPanel } from '../components/dashboard/ActionsPanel';
import { GithubOverviewCard } from '../components/dashboard/GithubOverviewCard';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import { WeeklyMomentumBar } from '../features/gamification/components/WeeklyMomentumBar';
import { ProjectsMomentumList } from '../components/dashboard/ProjectsMomentumList';
import { PomodoroTimer } from '../components/dashboard/PomodoroTimer';
import { GamificationPanel } from '../components/dashboard/GamificationPanel';
import { BadgesMomentumCard } from '../components/dashboard/BadgesMomentumCard';

interface RecentActivityVM {
  id: string;
  icon: any;
  title: string;
  description: string;
  platformLabel: string;
  timeAgo: string;
  url: string | null;
  typeColor: string;
}

function transformRecentActivities(items: any[]): RecentActivityVM[] {
  return items.map((item) => {
    let icon: any = 'clock';
    let typeColor = '#7C5CFC';

    switch (item.type) {
      case 'problem_solved':
        icon = 'check-circle';
        typeColor = '#FFA116';
        break;
      case 'commit_pushed':
        icon = 'git-commit';
        typeColor = '#24292F';
        break;
      case 'pr_merged':
        icon = 'arrow-path';
        typeColor = '#3B5998';
        break;
      case 'project_created':
        icon = 'folder-plus';
        typeColor = '#10B981';
        break;
      case 'project_updated':
        icon = 'edit';
        typeColor = '#3B82F6';
        break;
      case 'project_deleted':
        icon = 'trash';
        typeColor = '#EF4444';
        break;
      case 'contest_participated':
        icon = 'academic-cap';
        typeColor = '#8B5CF6';
        break;
      case 'streak_milestone':
        icon = 'fire';
        typeColor = '#EF4444';
        break;
      default:
        icon = 'clock';
        typeColor = '#64748B';
    }

    const elapsed = Date.now() - new Date(item.occurredAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeAgo = 'Just now';
    if (days > 0) timeAgo = `${days}d ago`;
    else if (hours > 0) timeAgo = `${hours}h ago`;
    else if (minutes > 0) timeAgo = `${minutes}m ago`;

    return {
      id: item.id,
      icon,
      title: item.title || 'Operational event',
      description: item.description || '',
      platformLabel: (item.platform || 'system').toUpperCase(),
      timeAgo,
      url: item.url,
      typeColor,
    };
  });
}

const SectionHeader: React.FC<{ icon: string; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 px-0.5 mb-0">
    <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-dt-primary/8 to-dt-primary/4 flex items-center justify-center border border-dt-primary/10 shadow-[0_2px_8px_rgba(124,92,252,0.08)] shrink-0 backdrop-blur-sm">
      <span className="text-[16px]">{icon}</span>
    </div>
    <div className="min-w-0">
      <h2 className="text-[13px] font-extrabold text-dt-text tracking-[0.08em] uppercase truncate">{title}</h2>
      <p className="text-[11px] font-semibold text-dt-textSecondary/80 truncate leading-tight">{subtitle}</p>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { data, loading, error } = useDashboardData();
  const navigate = useNavigate();
  const logout = useUserStore((s) => s.logout);
  const [contests, setContests] = React.useState<{ name: string; platform: string; time: string }[]>([]);

  const activities = React.useMemo(() => {
    return transformRecentActivities(data?.recentActivity ?? []);
  }, [data?.recentActivity]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  React.useEffect(() => {
    const loadContests = async () => {
      try {
        const response = await fetchDsaContests({ pageSize: 10 });
        if (response.success) {
          const allContests = response.data.contests;
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const recent = allContests
            .filter((c: ApiDsaContestEntry) => new Date(c.participatedAt) >= sevenDaysAgo)
            .map((c: ApiDsaContestEntry) => ({
              name: c.contestName,
              platform: c.platform,
              time: new Date(c.participatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }));
          setContests(recent);
        }
      } catch (err) {
        console.error('Failed to fetch contests:', err);
      }
    };
    loadContests();
  }, []);

  if (loading) {
    return (
      <div className="dt-fade-in max-w-[1400px] mx-auto w-full">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dt-fade-in">
        <div className="text-center bg-white border border-red-100 rounded-3xl p-10 shadow-xl max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6 border border-red-100">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Sync Failed</h2>
          <p className="text-[14px] text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-dt-primary text-white font-semibold hover:bg-dt-primary/90 transition-all shadow-md shadow-dt-primary/20"
            >
              Try Again
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-gray-50 text-red-500 font-semibold hover:bg-red-50 transition-all border border-gray-200 hover:border-red-100"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto w-full dt-stagger pb-16 px-4 lg:px-6 relative">
      {/* Elite Cinematic Atmospheric Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-gradient-to-br from-[#FAFBFD] via-[#F8F9FC] to-[#F6F8FB]">
        <div className="absolute top-[-15%] right-[-8%] w-[900px] h-[900px] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-dt-primary/8 via-dt-secondary/3 to-transparent blur-[120px] rounded-full mix-blend-multiply opacity-60 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[35%] left-[-12%] w-[700px] h-[700px] bg-[radial-gradient(circle_at_center_left,_var(--tw-gradient-stops))] from-blue-200/15 via-violet-100/8 to-transparent blur-[120px] rounded-full mix-blend-multiply opacity-40 animate-[pulse_10s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-rose-200/10 via-purple-100/5 to-transparent blur-[100px] rounded-full mix-blend-multiply opacity-30 animate-[pulse_12s_ease-in-out_infinite_4s]" />
      </div>

      {/* ==========================================
          SECTION 1 — HERO HEADER
          ========================================== */}
      <section className="mb-2">
        <DashboardHeader />
      </section>

      {/* ==========================================
          SECTION 1B — STATS GRID (FULL WIDTH)
          ========================================== */}
      <section className="mb-4">
        <StatsGrid stats={data?.stats} platformStats={data?.platformStats} />
      </section>

      {/* ==========================================
          SECTION 2 — DAILY PROGRESSION ZONE
          ========================================== */}
      <section className="mb-4">
        <div className="flex flex-col gap-3">
          <SectionHeader
            icon="🔥"
            title="Daily Progression"
            subtitle="Streak, goals, and momentum tracking"
          />
          
          {/* TOP ROW: Streak + Daily Goal + Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Daily Streak Card - Large Purple Card */}
            <div className="md:col-span-1">
              <div
                className="bg-gradient-to-br from-[#6D4FF2] via-[#7C5CFC] to-[#A78BFA] rounded-[28px] p-5 shadow-dt-floating hover:shadow-[0_40px_120px_rgba(124,92,252,0.18)] hover:-translate-y-1 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden group"
                style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) both' }}
              >
                {/* Cinematic Overlays */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.05),transparent_30%)]" />

                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-md shadow-sm">
                  <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">
                    BEST: {data?.streakData?.longestStreak || 0}
                  </span>
                </div>

                <div className="relative flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-xl relative shrink-0">
                    <div className="absolute inset-0 rounded-xl bg-white/5 animate-pulse" />
                    <span className="text-2xl relative z-10">🔥</span>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white tabular-nums leading-none tracking-tighter drop-shadow-lg">
                      {data?.streakData?.currentStreak || 0}
                    </div>
                    <div className="text-[10px] text-white/80 mt-0.5 font-bold tracking-[0.1em] uppercase opacity-90">
                      day streak
                    </div>
                  </div>
                </div>

                {/* Week Activity */}
                <div className="flex items-center gap-2 relative z-10">
                  {['T', 'F', 'S', 'S', 'M', 'T', 'W'].map((day, i) => {
                    const isActive = i < (data?.streakData?.currentStreak || 0) % 7;
                    return (
                      <div key={i} className="flex-1 aspect-square max-w-[35px] rounded-full flex items-center justify-center transition-all duration-500 relative">
                        <div
                          className={[
                            'absolute inset-0 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500',
                            isActive
                              ? 'bg-white/90 text-[#7C5CFC] shadow-[0_4px_15px_rgba(255,255,255,0.4)] scale-105 z-10 backdrop-blur-md border border-white'
                              : 'bg-white/5 text-white/40 border border-white/20 backdrop-blur-sm',
                          ].join(' ')}
                        >
                          <span className="tracking-tighter">{day}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {data?.streakData?.isActiveToday && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 relative z-10">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_12px_white]"></span>
                    </div>
                    <span className="text-[13px] text-white font-bold tracking-tight opacity-95">
                      Activity Logged — Consistency is your superpower
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Goal Card */}
            <div className="md:col-span-1">
              <div
                className="dt-card p-5 flex flex-col justify-between bg-white rounded-[28px] border border-gray-300 shadow-dt-floating hover:shadow-dt-card-hover hover:border-dt-primary/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden h-full"
                style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 100ms both' }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.03),transparent_40%)]" />

                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-dt-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-dt-primary/5">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-dt-textMuted font-black uppercase tracking-[0.2em]">Focus</div>
                    <div className="text-lg font-black text-dt-text tracking-tighter leading-tight">Daily Goal</div>
                  </div>
                </div>

                {!data?.missions || data.missions.length === 0 ? (
                  <div className="relative mt-3 flex items-center justify-center h-full">
                    <p className="text-[12px] text-dt-textSecondary font-bold text-center">Sync to set goals</p>
                  </div>
                ) : (
                  <div className="relative mt-3">
                    {(() => {
                      const dailyMission = data.missions.find(m => m.type === 'daily' && m.status !== 'completed' && m.status !== 'expired');
                      const solved = dailyMission?.currentCount ?? 0;
                      const target = dailyMission?.targetCount ?? 6;
                      const pct = target > 0 ? Math.round((solved / target) * 100) : 0;
                      
                      return (
                        <>
                          <div className="flex items-end justify-between mb-1.5">
                            <div className="text-2xl font-black text-dt-text tabular-nums tracking-tighter leading-none">
                              {pct}<span className="text-sm text-dt-textSecondary/40 ml-0.5">%</span>
                            </div>
                            <div className="text-[10px] font-bold text-dt-textSecondary/60 tabular-nums">{solved}/{target} done</div>
                          </div>
                          <div className="h-2 w-full bg-dt-primary/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Badges/Momentum Card */}
            <div className="md:col-span-1">
              <BadgesMomentumCard 
                totalProblems={data?.stats?.totalProblems || 0}
                longestStreak={data?.streakData?.longestStreak || 0}
              />
            </div>
          </div>

          {/* BOTTOM ROW: Weekly Momentum Bar */}
          <div className="mt-2">
            <WeeklyMomentumBar weeklyXpData={data?.stats?.weeklyXPHistory} />
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 3 — ANALYTICS + PLATFORM INTEL
          ========================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-4 items-start">
        {/* LEFT SIDE: AI Analytics + GitHub (2/3 width) */}
        <div className="lg:col-span-8 flex flex-col gap-6 self-start">
          <div className="flex flex-col gap-3">
            <SectionHeader
              icon="🧠"
              title="AI Analysis"
              subtitle="Neural momentum & insights"
            />
            <EnhancedInsightsCard />
          </div>
          
          <GithubOverviewCard data={data} />
        </div>
        
        {/* RIGHT SIDE: Platform Intel (1/3 width) */}
        <div className="lg:col-span-4 flex flex-col gap-3 self-start">
          <SectionHeader
            icon="🎯"
            title="Platform Intel"
            subtitle="Ecosystem performance"
          />
          <div className="flex flex-col gap-4">
            <ProgressCards platformStats={data?.platformStats} />
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 4 — FOCUS ENGINE
          ========================================== */}
      <section className="mb-4">
        <div className="flex flex-col gap-4">
          <SectionHeader
            icon="⏱️"
            title="Focus Engine"
            subtitle="Deep work sessions and productivity tracking"
          />
          <div className="max-w-4xl mx-auto w-full">
            <PomodoroTimer />
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 5 — BOTTOM GRID
          ========================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Project Momentum */}
        <div className="flex flex-col gap-3">
          <SectionHeader
            icon="💻"
            title="Project Momentum"
            subtitle="Sprint velocity and tasks"
          />
          <ProjectsMomentumList />
        </div>
        
        {/* CENTER: Upcoming Contests */}
        <div className="flex flex-col gap-3">
          <SectionHeader
            icon="🏆"
            title="Upcoming Contests"
            subtitle="Competition schedule"
          />
          <AnnouncementSection contests={contests} />
        </div>
        
        {/* RIGHT: Quick Actions */}
        <div className="flex flex-col gap-3">
          <SectionHeader
            icon="⚡"
            title="Quick Actions"
            subtitle="Rapid navigation"
          />
          <ActionsPanel />
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;