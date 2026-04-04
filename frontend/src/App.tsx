import { AppRouter } from './router';
import React from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { useUserStore } from './store/userStore';
import type { SidebarNavItemVM, TopbarVM } from './types/vm.types';

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

const AppShell: React.FC = () => {
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
    <div className="flex min-h-screen w-full bg-[#fff7f0] text-zinc-900 overflow-hidden">
      <Sidebar
        navItems={navItems}
        isCollapsed={false}
        onToggleCollapse={() => undefined}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          data={topbarData}
          onNotificationsClick={() => {}}
          onProfileClick={() => navigate('/settings')}
          onSearchClick={() => {}}
        />

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <AppRouter />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
