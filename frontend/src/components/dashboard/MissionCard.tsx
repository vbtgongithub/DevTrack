import React from 'react';
import { Icon } from '../shared/Icon';

export const MissionCard: React.FC = () => {
  return (
    <div className="h-full bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 space-y-3">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-[#444]">Today's Mission</div>
        <div className="text-sm font-semibold text-[#1f1f1f]">66%</div>
      </div>

      <div className="text-sm text-[#6b6b6b]">2/3 completed</div>

      <div className="w-full h-2 bg-[#e5dfd6] rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-500"
          style={{ width: '66%' }}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-700">
          <Icon name="check-circle" size={20} className="w-5 h-5 object-contain" />
          <div className="text-sm text-zinc-700">Solve 2 Medium Problems</div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-700">
          <Icon name="check-circle" size={20} className="w-5 h-5 object-contain" />
          <div className="text-sm text-zinc-700">Review 1 Past Mistake</div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-700">
          <Icon name="circle" size={20} className="w-5 h-5 object-contain text-[#8a8a8a]" />
          <div className="text-sm text-zinc-700">Push 1 GitHub Commit</div>
        </div>
      </div>

      <div className="text-xs text-[#8a8a8a]">You're one task away from completing today's goals.</div>
    </div>
  );
};
