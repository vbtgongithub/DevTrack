import React from 'react';
import { PlatformStatCard, type PlatformStatCardProps, type PlatformStatCardColor } from './PlatformStatCard';
import { StatCard, type StatCardProps } from './StatCard';
import { Icon } from '../shared/Icon';
import type { ApiPlatformStats, ApiDashboardStats } from '../../types/api.types';

import fireLogo from '../../assets/logos/FireLogo.png';

import leetcodeLogo from '../../assets/logos/LeetCode.png';
import codeforcesLogo from '../../assets/logos/Codeforces.png';
import codechefLogo from '../../assets/logos/CodeChef.png';
import githubLogo from '../../assets/logos/github.png';

interface StatsGridProps {
  stats: ApiDashboardStats | null | undefined;
  platformStats: ApiPlatformStats[] | null | undefined;
}

const getPlatformLogo = (platformName: string): string => {
  switch (platformName) {
    case 'leetcode': return leetcodeLogo;
    case 'codeforces': return codeforcesLogo;
    case 'codechef': return codechefLogo;
    case 'github': return githubLogo;
    default: return leetcodeLogo;
  }
};

const getPlatformColor = (platformName: string): PlatformStatCardColor => {
  switch (platformName) {
    case 'leetcode': return 'yellow';
    case 'codeforces': return 'blue';
    case 'codechef': return 'orange';
    case 'github': return 'green';
    default: return 'yellow';
  }
};

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, platformStats }) => {
  // Build general stats from backend data - PRIORITY METRICS
  const generalStats: StatCardProps[] = React.useMemo(() => {
    const totalProblems = stats?.totalProblems ?? 0;
    const streak = stats?.currentStreak ?? 0;
    const activeDays = stats?.totalActiveDays ?? 0;
    const projects = stats?.totalProjects ?? 0;

    return [
      {
        label: 'Problems Solved',
        value: totalProblems > 0 ? totalProblems.toLocaleString() : '0',
        leading: <Icon name="code-bracket" size={20} className="text-indigo-600" />,
        highlight: true,
      },
      {
        label: 'Active Days',
        value: activeDays > 0 ? activeDays.toString() : '0',
        leading: <Icon name="calendar" size={20} className="text-emerald-600" />,
      },
      {
        label: 'Current Streak',
        value: streak > 0 ? `${streak} 🔥` : '—',
        leading: <img src={fireLogo} alt="Streak" className="w-5 h-5 object-contain" />,
        highlight: streak > 0,
      },
      {
        label: 'Projects',
        value: projects > 0 ? projects.toString() : '0',
        leading: <Icon name="folder" size={20} className="text-blue-600" />,
      },
    ];
  }, [stats]);

  // Build platform stats from backend data
  const platformCards: PlatformStatCardProps[] = React.useMemo(() => {
    if (!platformStats || platformStats.length === 0) {
      return [
        { name: 'LeetCode', problems: 0, rating: '—', logo: leetcodeLogo, color: 'yellow', connected: false },
        { name: 'Codeforces', problems: 0, rating: '—', logo: codeforcesLogo, color: 'blue', connected: false },
        { name: 'CodeChef', problems: 0, rating: '—', logo: codechefLogo, color: 'orange', connected: false },
        { name: 'GitHub', problems: 0, rating: '—', logo: githubLogo, color: 'green', connected: false },
      ];
    }

    return platformStats
      .map((p) => {
        const isGithub = p.platformName.toLowerCase() === 'github';
        const hasData = (p.totalSolved || 0) > 0;
        return {
          name: isGithub ? 'GitHub' : p.platformName.charAt(0).toUpperCase() + p.platformName.slice(1),
          problems: p.totalSolved || 0,
          label: isGithub ? 'Repos' : 'Problems',
          rating: p.rating ? p.rating.toString() : '—',
          ratingLabel: isGithub ? 'Stars' : 'Rating',
          logo: getPlatformLogo(p.platformName),
          color: getPlatformColor(p.platformName),
          connected: hasData,
        };
      });
  }, [platformStats]);

  return (
    <div className="space-y-6">
      {/* Primary metrics - larger cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch">
        {generalStats.map((s, i) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            leading={s.leading}
            highlight={s.highlight}
            delay={i * 50}
          />
        ))}
      </div>

      {/* Platform cards - unified row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch">
        {platformCards.map((p, i) => (
          <PlatformStatCard
            key={p.name}
            name={p.name}
            problems={p.problems}
            label={p.label}
            rating={p.rating}
            ratingLabel={p.ratingLabel}
            logo={p.logo}
            color={p.color}
            connected={p.connected}
            delay={i * 50}
          />
        ))}
      </div>
    </div>
  );
};