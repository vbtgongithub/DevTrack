import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUserStore } from '../../store/userStore';
import type { SidebarNavItemVM, TopbarVM } from '../../types/vm.types';

const NAV_ITEMS: Omit<SidebarNavItemVM, 'isActive'>[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/', badge: null },
  { id: 'dsa', label: 'DSA', icon: 'code-bracket', path: '/dsa', badge: null },
  { id: 'projects', label: 'Projects', icon: 'folder', path: '/projects', badge: null },
  { id: 'activity', label: 'Activity', icon: 'chart-bar', path: '/activity', badge: null },
  { id: 'profile', label: 'Profile', icon: 'user', path: '/profile', badge: null },
  { id: 'settings', label: 'Settings', icon: 'cog', path: '/settings', badge: null },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/activity': 'Activity',
  '/dsa': 'DSA Tracker',
  '/projects': 'Projects',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const navItems: SidebarNavItemVM[] = NAV_ITEMS.map((item) => ({
    ...item,
    isActive: location.pathname === item.path,
  }));

  const currentPageTitle = PAGE_TITLES[location.pathname] || 'DevTrack';

  const topbarData: TopbarVM = {
    displayName: user?.displayName || 'User',
    avatarUrl: user?.avatarUrl || null,
    currentPageTitle,
    breadcrumbs: [
      { label: 'Home', path: '/' },
      ...(location.pathname !== '/'
        ? [{ label: currentPageTitle, path: location.pathname }]
        : []),
    ],
    notifications: 0,
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar
        navItems={navItems}
        isCollapsed={false}
        onToggleCollapse={() => undefined}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />
      <div className="flex-1 overflow-hidden">
        <Topbar
          data={topbarData}
          onNotificationsClick={() => {}}
          onProfileClick={() => navigate('/settings')}
          onSearchClick={() => {}}
        />
        <main className="h-[calc(100vh-64px)] overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
