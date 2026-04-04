import React from 'react';
import { PlatformStatCard, type PlatformStatCardProps } from './PlatformStatCard';
import { StatCard, type StatCardProps } from './StatCard';
import { Icon } from '../shared/Icon';

import githubLogo from '../../assets/logos/github.png';
import fireLogo from '../../assets/logos/FireLogo.png';

import leetcodeLogo from '../../assets/logos/LeetCode.png';
import codeforcesLogo from '../../assets/logos/Codeforces.png';
import codechefLogo from '../../assets/logos/CodeChef.png';
import hackerrankLogo from '../../assets/logos/HackerRank.png';

const GENERAL_STATS: StatCardProps[] = [
  {
    label: 'Total Problems',
    value: 1250,
    leading: <Icon name="chart-bar" size={24} className="w-8 h-8 text-gray-700" />,
  },
  {
    label: 'GitHub Contributions',
    value: 350,
    leading: <img src={githubLogo} alt="GitHub" className="w-8 h-8 object-contain" />,
  },
  {
    label: 'Current Streak',
    value: 45,
    leading: <img src={fireLogo} alt="Streak" className="w-8 h-8 object-contain" />,
  },
  {
    label: 'Active Days',
    value: 180,
    leading: <Icon name="calendar" size={24} className="w-8 h-8 text-gray-700" />,
  },
];

const PLATFORMS: PlatformStatCardProps[] = [
  { name: 'LeetCode', problems: 600, rating: 1850, logo: leetcodeLogo, color: 'yellow' },
  { name: 'Codeforces', problems: 300, rating: 1800, logo: codeforcesLogo, color: 'blue' },
  { name: 'CodeChef', problems: 200, rating: 1700, logo: codechefLogo, color: 'orange' },
  { name: 'HackerRank', problems: 150, rating: '★ 5', logo: hackerrankLogo, color: 'green' },
];

export const StatsGrid: React.FC = () => {
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
