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
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
      <div className="w-[560px] max-w-full rounded-full bg-zinc-100 px-4 py-2 flex items-center gap-3">
        <Icon name="search" size={20} className="w-5 h-5 object-contain text-[#6b6b6b]" />
        <input
          className="w-full bg-transparent outline-none text-sm text-[#1f1f1f] placeholder:text-[#8a8a8a]"
          placeholder="Search problems, contributions, activity..."
          onFocus={onSearchClick}
          aria-label="Search"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onNotificationsClick}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[#6b6b6b] transition-all duration-200 hover:bg-[#ebe6df]"
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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#ebe6df]" />
          <div className="text-sm font-medium text-[#444]">{data.displayName}</div>
        </button>
      </div>

      <span className="hidden" aria-hidden="true">
        {data.currentPageTitle}
      </span>
    </header>
  );
};
