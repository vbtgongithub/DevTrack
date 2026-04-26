import React from 'react';
import { PlatformStatCard, type PlatformStatCardProps, type PlatformStatCardColor } from './PlatformStatCard';
import { StatCard, type StatCardProps } from './StatCard';
import { Icon } from '../shared/Icon';
import type { DashboardData } from '../../hooks/useDashboardData';

import githubLogo from '../../assets/logos/github.png';
import fireLogo from '../../assets/logos/FireLogo.png';
import leetcodeLogo from '../../assets/logos/LeetCode.png';
import codeforcesLogo from '../../assets/logos/Codeforces.png';
import codechefLogo from '../../assets/logos/CodeChef.png';
import hackerrankLogo from '../../assets/logos/HackerRank.png';

interface StatsGridProps {
  data: DashboardData | null;
}

// Map platform name → logo + display color
const PLATFORM_META: Record<string, { logo: string; color: PlatformStatCardColor }> = {
  leetcode: { logo: leetcodeLogo, color: 'yellow' },
  codeforces: { logo: codeforcesLogo, color: 'blue' },
  codechef: { logo: codechefLogo, color: 'orange' },
  hackerrank: { logo: hackerrankLogo, color: 'green' },
};

export const StatsGrid: React.FC<StatsGridProps> = ({ data }) => {
  const totalSolved = data?.totalSolved ?? 0;
  const streak = data?.streak ?? 0;
  const stats = data?.stats;
  const platformStats = data?.platformStats ?? [];

  // ── General stat cards (from backend stats) ────────────────────────────
  const GENERAL_STATS: StatCardProps[] = [
    {
      label: 'Total Problems',
      value: totalSolved,
      leading: <Icon name="chart-bar" size={24} className="w-8 h-8 text-gray-700" />,
    },
    {
      label: 'GitHub Contributions',
      value: stats?.totalContributions ?? 0,
      leading: <img src={githubLogo} alt="GitHub" className="w-8 h-8 object-contain" />,
    },
    {
      label: 'Current Streak',
      value: streak,
      leading: <img src={fireLogo} alt="Streak" className="w-8 h-8 object-contain" />,
    },
    {
      label: 'Active Days',
      value: stats?.totalActiveDays ?? 0,
      leading: <Icon name="calendar" size={24} className="w-8 h-8 text-gray-700" />,
    },
  ];

  // ── Platform cards (from backend platformStats) ────────────────────────
  // Build from real data; fall back to the 4 known platforms with zeros
  const DEFAULT_PLATFORMS: PlatformStatCardProps[] = [
    { name: 'LeetCode', problems: 0, rating: 0, logo: leetcodeLogo, color: 'yellow' },
    { name: 'Codeforces', problems: 0, rating: 0, logo: codeforcesLogo, color: 'blue' },
    { name: 'CodeChef', problems: 0, rating: 0, logo: codechefLogo, color: 'orange' },
    { name: 'HackerRank', problems: 0, rating: '★ 0', logo: hackerrankLogo, color: 'green' },
  ];

  const PLATFORMS: PlatformStatCardProps[] =
    platformStats.length > 0
      ? DEFAULT_PLATFORMS.map((def) => {
          const apiP = platformStats.find(
            (p) => p.platformName.toLowerCase() === def.name.toLowerCase()
          );
          if (!apiP) return def;
          const meta = PLATFORM_META[apiP.platformName] ?? { logo: def.logo, color: def.color };
          return {
            name: def.name,
            problems: apiP.totalSolved,
            rating: apiP.rating ?? 0,
            logo: meta.logo,
            color: meta.color,
          };
        })
      : DEFAULT_PLATFORMS;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-4 gap-6 items-stretch">
        {GENERAL_STATS.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} leading={s.leading} />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6 items-stretch">
        {PLATFORMS.map((p) => (
          <PlatformStatCard
            key={p.name}
            name={p.name}
            problems={p.problems}
            rating={p.rating}
            logo={p.logo}
            color={p.color}
          />
        ))}
      </div>
    </section>
  );
};
