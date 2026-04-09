import React from 'react';
import { Icon } from '../shared/Icon';

export const ActionsPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          <Icon name="bolt" size={14} className="text-gray-600" />
        </div>
        <span className="text-sm font-semibold text-gray-900">Quick Actions</span>
      </div>

      <button
        type="button"
        className={[
          'w-full bg-black text-white rounded-xl py-3.5 font-semibold text-sm',
          'shadow-sm cursor-pointer',
          'hover:bg-gray-900 hover:shadow-lg hover:scale-[1.02]',
          'active:scale-[0.97]',
          'transition-all duration-200 ease-out',
          'flex items-center justify-center gap-2',
        ].join(' ')}
      >
        <Icon name="folder-plus" size={16} className="text-white" />
        Create Project
      </button>

      <button
        type="button"
        className={[
          'w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600',
          'cursor-pointer',
          'hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm',
          'active:scale-[0.97]',
          'transition-all duration-200 ease-out',
          'flex items-center justify-center gap-2',
        ].join(' ')}
      >
        <Icon name="chart-bar" size={15} className="text-gray-400" />
        Log Activity
      </button>

      <button
        type="button"
        className={[
          'w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600',
          'cursor-pointer',
          'hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm',
          'active:scale-[0.97]',
          'transition-all duration-200 ease-out',
          'flex items-center justify-center gap-2',
        ].join(' ')}
      >
        <Icon name="eye" size={15} className="text-gray-400" />
        Review Mistakes
      </button>
    </div>
  );
};
