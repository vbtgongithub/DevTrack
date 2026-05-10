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
  // Build general stats from backend data
  const generalStats: StatCardProps[] = React.useMemo(() => {
    const totalProblems = stats?.totalProblems ?? 0;
    const streak = stats?.currentStreak ?? 0;
    const activeDays = stats?.totalActiveDays ?? 0;
    const projects = stats?.totalProjects ?? 0;

    return [
      {
        label: 'Total Problems',
        value: totalProblems > 0 ? totalProblems.toLocaleString() : '—',
        leading: <Icon name="chart-bar" size={24} className="w-8 h-8 text-gray-700" />,
      },
      {
        label: 'Projects',
        value: projects > 0 ? projects.toString() : '—',
        leading: <Icon name="folder" size={24} className="w-8 h-8 text-gray-700" />,
      },
      {
        label: 'Current Streak',
        value: streak > 0 ? `${streak} days` : '—',
        leading: <img src={fireLogo} alt="Streak" className="w-8 h-8 object-contain" />,
      },
      {
        label: 'Active Days',
        value: activeDays > 0 ? activeDays.toString() : '—',
        leading: <Icon name="calendar" size={24} className="w-8 h-8 text-gray-700" />,
      },
    ];
  }, [stats]);

  // Build platform stats from backend data
  const platformCards: PlatformStatCardProps[] = React.useMemo(() => {
    if (!platformStats || platformStats.length === 0) {
      // Show empty state placeholders when no data
      return [
        { name: 'LeetCode', problems: 0, rating: '—', logo: leetcodeLogo, color: 'yellow' },
        { name: 'Codeforces', problems: 0, rating: '—', logo: codeforcesLogo, color: 'blue' },
        { name: 'CodeChef', problems: 0, rating: '—', logo: codechefLogo, color: 'orange' },
        { name: 'GitHub', problems: 0, rating: '—', logo: githubLogo, color: 'green' },
      ];
    }

    return platformStats
      .filter((p) => p.platformName.toLowerCase() !== 'hackerrank')
      .map((p) => {
        const isGithub = p.platformName.toLowerCase() === 'github';
        return {
          name: isGithub ? 'GitHub' : p.platformName.charAt(0).toUpperCase() + p.platformName.slice(1),
          problems: p.totalSolved || 0,
          label: isGithub ? 'Repos' : 'Problems Solved',
          rating: p.rating ? p.rating.toString() : '—',
          ratingLabel: isGithub ? 'Stars' : 'Rating',
          logo: getPlatformLogo(p.platformName),
          color: getPlatformColor(p.platformName),
        };
      });
  }, [platformStats]);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-4 gap-6 items-stretch">
        {generalStats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} leading={s.leading} />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6 items-stretch">
        {platformCards.map((p) => (
          <PlatformStatCard
            key={p.name}
            name={p.name}
            problems={p.problems}
            label={p.label}
            rating={p.rating}
            ratingLabel={p.ratingLabel}
            logo={p.logo}
            color={p.color}
          />
        ))}
      </div>
    </section>
  );
};
