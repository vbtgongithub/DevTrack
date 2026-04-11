// ============================================================================
// ProfilePage.tsx — Developer Portfolio Dashboard
// ============================================================================
import React from 'react';
import { Icon } from '../components/shared/Icon';
import {
  PROFILE_USER,
  PROFILE_STATS,
  PROFILE_PLATFORMS,
  PROFILE_TOPICS,
  PROFILE_ACTIVITY,
  PROFILE_ACHIEVEMENTS,
  PROFILE_INSIGHTS,
} from '../mocks/profileMockData';

import leetcodeLogo from '../assets/logos/LeetCode.png';
import codeforcesLogo from '../assets/logos/Codeforces.png';
import codechefLogo from '../assets/logos/CodeChef.png';
import hackerrankLogo from '../assets/logos/HackerRank.png';

const PLATFORM_LOGOS: Record<string, string> = {
  LeetCode: leetcodeLogo,
  Codeforces: codeforcesLogo,
  CodeChef: codechefLogo,
  HackerRank: hackerrankLogo,
};

const STAT_COLORS: Record<string, { bg: string; icon: string }> = {
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  gray: { bg: 'bg-gray-100', icon: 'text-gray-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  purple: { bg: 'bg-violet-50', icon: 'text-violet-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
};

const STAT_DELTAS: Record<string, string> = {
  'Problems Solved': '+45 this month ↑',
  'GitHub Contributions': '+12 this week ↑',
  'Current Streak': 'Personal best: 31d',
  'Active Days': '+8 this month ↑',
  'Projects': '2 active',
  'Contest Rating': '+84 this month ↑',
};

const INSIGHT_COLORS: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  purple: { bg: 'bg-violet-50', icon: 'text-violet-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
};

/* ─── Profile Hero ─── */
const ProfileHero: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out">
    <div className="flex flex-col sm:flex-row items-start gap-6">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-lg">
          {PROFILE_USER.avatarUrl ? (
            <img src={PROFILE_USER.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            <span className="text-3xl font-bold text-white">{PROFILE_USER.displayName.charAt(0)}</span>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center">
          <Icon name="check-circle" size={14} className="text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-gray-900">{PROFILE_USER.displayName}</h1>
          <span className="text-sm text-gray-500 font-medium">{PROFILE_USER.username}</span>
        </div>

        {/* Identity line */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-medium text-orange-600">🔥 12-day streak</span>
          <span className="text-gray-300">•</span>
          <span className="text-sm font-medium text-indigo-600">Top 20% consistency</span>
        </div>

        <p className="text-sm text-gray-500 mt-2 max-w-xl leading-relaxed">{PROFILE_USER.bio}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Icon name="map-pin" size={13} className="text-gray-400" />
            {PROFILE_USER.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="briefcase" size={13} className="text-gray-400" />
            {PROFILE_USER.company}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="calendar" size={13} className="text-gray-400" />
            Joined {PROFILE_USER.joinedDate}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { icon: 'github', url: PROFILE_USER.github, label: 'GitHub' },
            { icon: 'link', url: PROFILE_USER.website, label: 'Website' },
            { icon: 'mail', url: `mailto:${PROFILE_USER.email}`, label: 'Email' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                'bg-gray-100 text-gray-700 border border-gray-200',
                'hover:bg-gray-200 hover:shadow-sm',
                'transition-all duration-200',
              ].join(' ')}
            >
              <Icon name={link.icon} size={13} className="text-gray-500" />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Stats Grid ─── */
const StatsGrid: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    {PROFILE_STATS.map((stat, index) => {
      const colors = STAT_COLORS[stat.color] || STAT_COLORS.gray;
      return (
        <div
          key={stat.id}
          className={[
            'bg-white border border-gray-200 rounded-2xl p-4',
            'shadow-sm hover:shadow-lg hover:-translate-y-0.5',
            'transition-all duration-200 ease-out',
            'flex flex-col items-center text-center gap-2',
          ].join(' ')}
          style={{ animation: `dtFadeIn 520ms ease-out ${index * 60}ms both` }}
        >
          <div className={['w-10 h-10 rounded-xl flex items-center justify-center', colors.bg].join(' ')}>
            <Icon name={stat.icon} size={18} className={colors.icon} />
          </div>
          <div className="text-xl font-bold text-gray-900 tabular-nums leading-none">{stat.value}</div>
          <div className="text-[11px] text-gray-500 font-medium">{stat.label}</div>
          {STAT_DELTAS[stat.label] && (
            <div className="text-[10px] text-emerald-600 font-medium">{STAT_DELTAS[stat.label]}</div>
          )}
        </div>
      );
    })}
  </div>
);

/* ─── Platform Connections ─── */
const PlatformConnections: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
        <Icon name="globe" size={16} className="text-blue-600" />
      </div>
      <h2 className="text-base font-semibold text-gray-900">Platform Connections</h2>
    </div>

    <div className="flex flex-col gap-4">
      {PROFILE_PLATFORMS.map((platform, index) => (
        <div
          key={platform.id}
          className="flex flex-col p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-200 ease-out cursor-default overflow-hidden"
          style={{ animation: `dtFadeIn 520ms ease-out ${index * 60}ms both` }}
        >
          {/* 1. Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={PLATFORM_LOGOS[platform.name]}
                  alt={platform.name}
                  className="w-5 h-5 object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-900">{platform.name}</span>
                <span className="text-xs text-gray-500">@{platform.username}</span>
              </div>
            </div>
            <span className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-green-50 text-green-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Connected
            </span>
          </div>

          {/* 2. Stats Row */}
          <div className="flex flex-col mb-2">
            <span className="text-2xl font-semibold tracking-tight text-gray-900 tabular-nums mb-1">{platform.problems}</span>
            <span className="text-sm text-gray-500 mb-2">problems solved</span>
          </div>

          {/* 3. Status Row */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-auto whitespace-nowrap overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="shrink-0">Live Sync</span>
            <span className="text-gray-300 shrink-0">•</span>
            <span className="truncate">Active {platform.lastSynced}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Topic Mastery ─── */
const TopicMastery: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <Icon name="layers" size={20} className="text-violet-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Topic Mastery</h2>
      </div>

      <div className="space-y-4">
        {PROFILE_TOPICS.map((topic, index) => {
          const barColor = topic.progress >= 80 ? 'bg-emerald-500' : topic.progress >= 60 ? 'bg-blue-500' : 'bg-amber-500';
          const labelColor = topic.progress >= 80 ? 'text-emerald-600' : topic.progress >= 60 ? 'text-blue-600' : 'text-amber-600';
          const statusText = topic.progress >= 80 ? 'Strong' : topic.progress >= 60 ? 'Good' : 'Needs work';

          return (
            <div key={topic.name} style={{ animation: `dtFadeIn 520ms ease-out ${index * 60}ms both` }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                  <span className={['text-[10px] font-bold', labelColor].join(' ')}>· {statusText}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 tabular-nums">{topic.solved}/{topic.total}</span>
                  <span className="text-xs font-bold text-gray-700 tabular-nums">{topic.progress}%</span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={['h-full rounded-full transition-all duration-700 ease-out', barColor].join(' ')}
                  style={{ width: mounted ? `${topic.progress}%` : '0%', transitionDelay: `${index * 60}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Activity Snapshot ─── */
const ActivitySnapshot: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const max = Math.max(...PROFILE_ACTIVITY.map((d) => d.count));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Icon name="activity" size={20} className="text-emerald-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">This Week</h2>
      </div>

      <div className="flex items-end gap-2 h-28">
        {PROFILE_ACTIVITY.map((item, i) => {
          const pct = Math.max((item.count / max) * 100, 8);
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-700 tabular-nums">{item.count}</span>
              <div
                className={[
                  'w-full rounded-md transition-all duration-500 ease-out',
                  'bg-gradient-to-t from-emerald-500 to-emerald-400',
                  'hover:from-emerald-600 hover:to-emerald-500',
                ].join(' ')}
                style={{
                  height: mounted ? `${pct}%` : '0%',
                  transitionDelay: `${i * 60}ms`,
                  minHeight: '4px',
                }}
              />
              <span className="text-[10px] text-gray-400 font-medium">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Achievements ─── */
const Achievements: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
          <Icon name="award" size={20} className="text-yellow-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Achievements</h2>
      </div>
      <span className="text-xs text-gray-500 font-medium tabular-nums">
        {PROFILE_ACHIEVEMENTS.filter((a) => a.unlocked).length}/{PROFILE_ACHIEVEMENTS.length}
      </span>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {PROFILE_ACHIEVEMENTS.map((badge, index) => (
        <div
          key={badge.id}
          className={[
            'relative flex flex-col items-center gap-2 p-3.5 rounded-xl border',
            'transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-default',
            badge.unlocked
              ? 'bg-white border-gray-200 hover:-translate-y-0.5'
              : 'bg-gray-50/80 border-gray-100 opacity-70 grayscale',
          ].join(' ')}
          style={{ animation: `dtFadeIn 520ms ease-out ${index * 50}ms both` }}
          title={badge.unlocked ? `${badge.title} — ${badge.date}` : `${badge.title} — Locked`}
        >
          <span className="text-2xl">{badge.icon}</span>
          <span className="text-[11px] font-semibold text-gray-800 text-center leading-tight">{badge.title}</span>
          <span className="text-[10px] text-gray-400 text-center leading-tight">{badge.description}</span>
          {badge.unlocked && badge.date && (
            <span className="text-[9px] text-gray-300 mt-0.5">{badge.date}</span>
          )}
          {!badge.unlocked && (
            <div className="absolute top-2 right-2">
              <Icon name="lock-closed" size={11} className="text-gray-300" />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

/* ─── Insights ─── */
const InsightsSection: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
        <Icon name="bolt" size={20} className="text-violet-600" />
      </div>
      <h2 className="text-base font-semibold text-gray-900">Insights</h2>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PROFILE_INSIGHTS.map((insight, index) => {
        const colors = INSIGHT_COLORS[insight.color] || INSIGHT_COLORS.blue;
        return (
          <div
            key={insight.id}
            className={[
              'flex items-center gap-3 p-3.5 rounded-xl',
              'transition-all duration-200 hover:shadow-sm cursor-default',
              colors.bg,
            ].join(' ')}
            style={{ animation: `dtFadeIn 520ms ease-out ${index * 60}ms both` }}
          >
            <div className="shrink-0 w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center shadow-sm">
              <Icon name={insight.icon} size={20} className={colors.icon} />
            </div>
            <span className="text-sm text-gray-700 font-medium leading-relaxed">{insight.text}</span>
          </div>
        );
      })}
    </div>
  </div>
);

/* ─── Main Profile Page ─── */
const ProfilePage: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div
      className={[
        'flex flex-col gap-6 max-w-5xl mx-auto transition-opacity duration-300',
        mounted ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <ProfileHero />
      <StatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformConnections />
        <TopicMastery />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Achievements />
        </div>
        <ActivitySnapshot />
      </div>

      <InsightsSection />
    </div>
  );
};

export default ProfilePage;
