import React from 'react';
import type { TopbarProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';

export const Topbar: React.FC<TopbarProps> = ({
  data,
  onNotificationsClick,
  onProfileClick,
  onSearchClick,
}) => {
  return (
    <header className="h-16 bg-white border-b border-gray-300 flex items-center justify-between px-6">
      <div className="w-[560px] max-w-full rounded-full bg-gray-100 px-4 py-2 flex items-center gap-3">
        <Icon name="search" size={20} className="w-5 h-5 object-contain text-gray-600" />
        <input
          className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-500"
          placeholder="Search problems, contributions, activity..."
          onFocus={onSearchClick}
          aria-label="Search"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onNotificationsClick}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-600 transition-all duration-200 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Icon name="bell" size={20} className="w-5 h-5 object-contain" />
        </button>

        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-3"
          aria-label="Profile"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100" />
          <div className="text-sm font-medium text-gray-900">{data.displayName}</div>
        </button>
      </div>

      <span className="hidden" aria-hidden="true">
        {data.currentPageTitle}
      </span>
    </header>
  );
};
