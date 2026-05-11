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
    <div className="flex h-screen w-full overflow-hidden text-dt-text p-3 sm:p-4 gap-2 sm:gap-4">
      <Sidebar
        navItems={navItems}
        isCollapsed={false}
        onToggleCollapse={() => undefined}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
        profile={{
          displayName: topbarData.displayName,
          avatarUrl: topbarData.avatarUrl,
          subtitle: 'Premium workspace',
        }}
      />
      <div className="flex-1 overflow-hidden bg-white/70 backdrop-blur-[40px] rounded-[32px] sm:rounded-[40px] border border-white/80 shadow-[0_8px_40px_rgba(124,92,252,0.06)] flex flex-col relative z-10 ring-1 ring-black/[0.02]">
        <Topbar
          data={topbarData}
          onNotificationsClick={() => { }}
          onProfileClick={() => navigate('/settings')}
          onSearchClick={() => { }}
        />
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 scroll-smooth">
          <div className="mx-auto w-full max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
