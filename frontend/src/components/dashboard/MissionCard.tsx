import React from 'react';
import { Icon } from '../shared/Icon';

export const MissionCard: React.FC = () => {
  return (
    <div className="h-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 space-y-3">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-gray-700">Today's Mission</div>
        <div className="text-sm font-semibold text-gray-900">66%</div>
      </div>

      <div className="text-sm text-gray-600">2/3 completed</div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
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

      <div className="text-xs text-gray-500">You're one task away from completing today's goals.</div>
    </div>
  );
};
