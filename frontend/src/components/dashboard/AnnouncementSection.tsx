import React from 'react';

import leetcodeLogo from '../../assets/logos/LeetCode.png';
import codeforcesLogo from '../../assets/logos/Codeforces.png';
import codechefLogo from '../../assets/logos/CodeChef.png';

type ContestRowProps = {
  logo: string;
  name: string;
  when: string;
  showDivider?: boolean;
};

const ContestRow: React.FC<ContestRowProps> = ({ logo, name, when, showDivider = true }) => {
  return (
    <div
      className={
        showDivider
          ? 'py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200'
          : 'py-3 hover:bg-gray-50 transition-colors duration-200'
      }
    >
      <div className="flex items-center justify-between gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <img src={logo} alt={name} className="h-6 object-contain shrink-0" />
          <div className="text-sm font-medium text-zinc-900 whitespace-nowrap truncate min-w-0">
            {name}
          </div>
        </div>
        <div className="text-sm text-gray-700 whitespace-nowrap shrink-0">{when}</div>
      </div>
    </div>
  );
};

export const AnnouncementSection: React.FC = () => {
  return (
    <section className="rounded-xl bg-white shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 border border-gray-100 p-5">
      <div className="text-sm font-semibold text-zinc-900">Upcoming Contests</div>

      <div className="mt-3">
        <ContestRow logo={leetcodeLogo} name="LeetCode Weekly Contest" when="Apr 6 | 8:00 PM" />
        <ContestRow logo={codeforcesLogo} name="Codeforces Round" when="Apr 7 | 9:30 PM" />
        <ContestRow
          logo={codechefLogo}
          name="CodeChef Starters"
          when="Apr 8 | 8:00 PM"
          showDivider={false}
        />
      </div>
    </section>
  );
};
