import React from 'react';
import { Icon } from '../shared/Icon';

import leetcodeLogo from '../../assets/logos/LeetCode.png';
import codeforcesLogo from '../../assets/logos/Codeforces.png';
import codechefLogo from '../../assets/logos/CodeChef.png';

type ContestRowProps = {
  logo: string;
  name: string;
  when: string;
  index: number;
};

const ContestRow: React.FC<ContestRowProps> = ({ logo, name, when, index }) => {
  return (
    <div
      className="flex items-center justify-between gap-4 min-w-0 py-3 px-3 -mx-1 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
      style={{ animation: `dtFadeIn 520ms ease-out ${index * 60}ms both` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:shadow-sm transition-all duration-200">
          <img src={logo} alt={name} className="w-5 h-5 object-contain" />
        </div>
        <div className="text-sm font-medium text-gray-900 whitespace-nowrap truncate min-w-0">
          {name}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-xs text-gray-500 whitespace-nowrap font-medium tabular-nums">{when}</div>
        <Icon name="chevron-right" size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors duration-200" />
      </div>
    </div>
  );
};

export const AnnouncementSection: React.FC = () => {
  return (
    <section className="rounded-2xl bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon name="calendar" size={15} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Upcoming Contests</h3>
        </div>
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">This Week</span>
      </div>

      <div className="mt-1 divide-y divide-gray-50">
        <ContestRow logo={leetcodeLogo} name="LeetCode Weekly Contest" when="Apr 6 · 8:00 PM" index={0} />
        <ContestRow logo={codeforcesLogo} name="Codeforces Round" when="Apr 7 · 9:30 PM" index={1} />
        <ContestRow logo={codechefLogo} name="CodeChef Starters" when="Apr 8 · 8:00 PM" index={2} />
      </div>
    </section>
  );
};
