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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 px-6 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black text-white">
            <Icon name="bolt" size={20} className="w-5 h-5 object-contain" />
          </div>
          <div className="text-lg font-semibold text-gray-900">DevTrack</div>
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
                    ? 'w-full flex items-center gap-3 px-3 py-2 rounded-md bg-gray-100 text-black transition-colors duration-200'
                    : 'w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-black'
                }
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                  <Icon
                    name={item.icon}
                    size={20}
                    className={item.isActive ? 'w-5 h-5 object-contain text-gray-900' : 'w-5 h-5 object-contain text-gray-500'}
                  />
                </div>
                <span className="truncate text-sm font-medium whitespace-nowrap">{item.label}</span>
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
