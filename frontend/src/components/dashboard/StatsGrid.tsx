import React from 'react';
import type { StatsGridProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';

export const StatsGrid: React.FC<StatsGridProps> = () => {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1f1f1f]">Stats Section</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#f0ebe5] text-[#444]">
            <Icon name="eye" size={20} className="w-5 h-5 object-contain" />
          </div>
          <div className="space-y-1">
            <div className="text-xl font-semibold text-[#1f1f1f]">1250</div>
            <div className="text-sm text-[#6b6b6b]">Total Problems Solved</div>
          </div>
        </div>

        <div className="bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#f0ebe5] text-[#444]">
            <Icon name="git-commit" size={20} className="w-5 h-5 object-contain" />
          </div>
          <div className="space-y-1">
            <div className="text-xl font-semibold text-[#1f1f1f]">350</div>
            <div className="text-sm text-[#6b6b6b]">GitHub Contributions</div>
          </div>
        </div>

        <div className="bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#f0ebe5] text-[#444]">
            <Icon name="calendar" size={20} className="w-5 h-5 object-contain" />
          </div>
          <div className="space-y-1">
            <div className="text-xl font-semibold text-[#1f1f1f]">45</div>
            <div className="text-sm text-[#6b6b6b]">Current Streak</div>
          </div>
        </div>

        <div className="bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#f0ebe5] text-[#444]">
            <Icon name="chart-bar" size={20} className="w-5 h-5 object-contain" />
          </div>
          <div className="space-y-1">
            <div className="text-xl font-semibold text-[#1f1f1f]">1800</div>
            <div className="text-sm text-[#6b6b6b]">Codeforces Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};
