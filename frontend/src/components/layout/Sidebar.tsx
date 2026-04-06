import React from 'react';
import type { SidebarProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
  profile,
}) => {
  return (
    <aside className="w-64 bg-transparent border-r border-black/5 flex flex-col">
      <div className="h-16 px-6 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-dt-surface border border-black/5 text-dt-text shadow-sm">
            <Icon name="bolt" size={18} className="w-5 h-5 object-contain" />
          </div>
          <div className="text-[15px] font-semibold tracking-tight text-dt-text">DevTrack</div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.path)}
                className={[
                  'group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150',
                  item.isActive ? 'bg-[#F3F4F6] text-dt-text' : 'text-dt-muted hover:bg-[#F3F4F6] hover:text-dt-text',
                ].join(' ')}
              >
                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  <span
                    className={[
                      'absolute left-[-10px] top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full transition-all duration-200',
                      item.isActive ? 'bg-[#111827] opacity-100' : 'opacity-0',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <div
                    className={[
                      'h-9 w-9 rounded-md flex items-center justify-center border border-transparent',
                      item.isActive ? 'bg-white border-black/5' : 'bg-transparent group-hover:bg-white group-hover:border-black/5',
                    ].join(' ')}
                  >
                    <Icon
                      name={item.icon}
                      size={16}
                      className={[
                        'w-5 h-5 object-contain',
                        item.isActive ? 'text-dt-text' : 'text-dt-muted group-hover:text-dt-text',
                      ].join(' ')}
                    />
                  </div>
                </div>
                <span className={['truncate text-[13px] whitespace-nowrap', item.isActive ? 'font-semibold' : 'font-medium'].join(' ')}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-4 pb-4">
        <div className="dt-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md border border-black/5 bg-white flex items-center justify-center overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icon name="user" size={18} className="text-dt-muted" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-dt-text truncate">{profile?.displayName ?? 'User'}</div>
              <div className="text-xs text-dt-muted truncate">{profile?.subtitle ?? 'Stay consistent'}</div>
            </div>
          </div>
        </div>
      </div>

      <button type="button" onClick={onToggleCollapse} className="hidden" aria-hidden="true">
        {isCollapsed ? 'expand' : 'collapse'}
      </button>
    </aside>
  );
};
