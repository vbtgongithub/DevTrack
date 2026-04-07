import React from 'react';
import { Icon } from '../shared/Icon';

export const ActionsPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-gray-900 mb-1">Quick Actions</div>

      <button
        type="button"
        className={[
          'w-full bg-gray-900 text-white rounded-xl py-3 font-medium text-sm',
          'shadow-md cursor-pointer',
          'hover:bg-black hover:shadow-lg hover:scale-[1.03]',
          'active:scale-[0.97]',
          'transition-all duration-200',
          'flex items-center justify-center gap-2',
        ].join(' ')}
      >
        <Icon name="folder-plus" size={16} className="text-white" />
        Create Project
      </button>

      <button
        type="button"
        className={[
          'w-full bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-900',
          'shadow-sm cursor-pointer',
          'hover:bg-gray-50 hover:shadow-md hover:scale-[1.02]',
          'active:scale-[0.97]',
          'transition-all duration-200',
          'flex items-center justify-center gap-2',
        ].join(' ')}
      >
        <Icon name="chart-bar" size={16} className="text-gray-500" />
        Log Activity
      </button>

      <button
        type="button"
        className={[
          'w-full bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-900',
          'shadow-sm cursor-pointer',
          'hover:bg-gray-50 hover:shadow-md hover:scale-[1.02]',
          'active:scale-[0.97]',
          'transition-all duration-200',
          'flex items-center justify-center gap-2',
        ].join(' ')}
      >
        <Icon name="eye" size={16} className="text-gray-500" />
        Review Mistakes
      </button>
    </div>
  );
};
