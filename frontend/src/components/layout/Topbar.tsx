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
    <header className="h-16 bg-dt-surface/80 backdrop-blur border-b border-black/5 flex items-center justify-between px-6">
      <div className="w-[560px] max-w-full rounded-lg bg-white border border-black/5 px-4 py-2 flex items-center gap-3 dt-pop">
        <Icon name="search" size={18} className="w-5 h-5 object-contain text-dt-muted" />
        <input
          className="w-full bg-transparent outline-none text-sm text-dt-text placeholder:text-dt-muted"
          placeholder="Search problems, contributions, activity..."
          onFocus={onSearchClick}
          aria-label="Search"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onNotificationsClick}
          className="w-11 h-11 rounded-lg flex items-center justify-center text-dt-muted dt-pop hover:bg-[#F3F4F6]"
          aria-label="Notifications"
        >
          <Icon name="bell" size={18} className="w-5 h-5 object-contain" />
        </button>

        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-3 dt-pop"
          aria-label="Profile"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-black/5 overflow-hidden">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name="user" size={18} className="text-dt-muted" />
            )}
          </div>
          <div className="text-[13px] font-medium text-dt-text">{data.displayName}</div>
        </button>
      </div>

      <span className="hidden" aria-hidden="true">
        {data.currentPageTitle}
      </span>
    </header>
  );
};
