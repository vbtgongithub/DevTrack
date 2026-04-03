import React from 'react';
import type { SidebarProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
      <div className="h-16 px-6 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black text-white">
            <Icon name="bolt" size={20} className="w-5 h-5 object-contain" />
          </div>
          <div className="text-lg font-semibold text-[#1f1f1f]">DevTrack</div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.path)}
                className={
                  item.isActive
                    ? 'w-full flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-100 text-[#1f1f1f] transition-all duration-200'
                    : 'w-full flex items-center gap-3 px-3 py-2 rounded-md text-[#6b6b6b] transition-all duration-200 hover:bg-[#ebe6df] hover:text-[#1f1f1f]'
                }
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                  <Icon name={item.icon} size={20} className="w-5 h-5 object-contain" />
                </div>
                <span className="truncate text-sm font-medium text-[#444]">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <button type="button" onClick={onToggleCollapse} className="hidden" aria-hidden="true">
        {isCollapsed ? 'expand' : 'collapse'}
      </button>
    </aside>
  );
};
