import React from 'react';

import leetcodeLogo from '../../assets/logos/LeetCode.png';
import codeforcesLogo from '../../assets/logos/Codeforces.png';
import codechefLogo from '../../assets/logos/CodeChef.png';

type ContestRowProps = {
  logo: string;
  name: string;
  when: string;
};

const ContestRow: React.FC<ContestRowProps> = ({ logo, name, when }) => {
  return (
    <div className="flex items-center justify-between gap-4 min-w-0 py-3 px-3 -mx-1 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
          <img src={logo} alt={name} className="w-5 h-5 object-contain" />
        </div>
        <div className="text-sm font-medium text-gray-900 whitespace-nowrap truncate min-w-0">
          {name}
        </div>
      </div>
      <div className="text-xs text-gray-500 whitespace-nowrap shrink-0 font-medium tabular-nums">{when}</div>
    </div>
  );
};

export const AnnouncementSection: React.FC = () => {
  return (
    <section className="rounded-xl bg-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-in-out border border-gray-200 p-5">
      <div className="text-sm font-semibold text-gray-900">Upcoming Contests</div>

      <div className="mt-2 divide-y divide-gray-100">
        <ContestRow logo={leetcodeLogo} name="LeetCode Weekly Contest" when="Apr 6 · 8:00 PM" />
        <ContestRow logo={codeforcesLogo} name="Codeforces Round" when="Apr 7 · 9:30 PM" />
        <ContestRow logo={codechefLogo} name="CodeChef Starters" when="Apr 8 · 8:00 PM" />
      </div>
    </section>
  );
};
