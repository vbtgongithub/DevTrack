import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { useUserStore } from './store/userStore';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { AppRouter } from './router';
import type { SidebarNavItemVM, TopbarVM } from './types/vm.types';

// ─── Navigation Config ─────────────────────────────────────────────────────
const NAV_ITEMS: Omit<SidebarNavItemVM, 'isActive'>[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard', badge: null },
  { id: 'dsa', label: 'DSA', icon: 'code-bracket', path: '/dsa', badge: null },
  { id: 'projects', label: 'Projects', icon: 'folder', path: '/projects', badge: null },
  { id: 'activity', label: 'History', icon: 'chart-bar', path: '/activity', badge: null },
  { id: 'profile', label: 'Profile', icon: 'user', path: '/profile', badge: null },
  { id: 'settings', label: 'Settings', icon: 'cog', path: '/settings', badge: null },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/activity': 'Smart History',
  '/dsa': 'DSA Tracker',
  '/projects': 'Projects',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

// ─── Boot Splash (shown while hydrating auth state) ────────────────────────
const BootSplash: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#fff7f0]">
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-500 tracking-wide">Loading DevTrack…</span>
    </div>
  </div>
);

// ─── Authenticated App Shell ───────────────────────────────────────────────
const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

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
    <div className="flex min-h-screen w-full bg-[#fff7f0] text-gray-900 overflow-hidden">
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
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <AppRouter />
        </div>
      </div>
    </div>
  );
};

// ─── Auth Gate (root router) ───────────────────────────────────────────────
const AuthGate: React.FC = () => {
  const status = useUserStore((s) => s.status);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const hydrate = useUserStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Still determining auth state — show branded splash
  if (status === 'idle' || status === 'loading') {
    return <BootSplash />;
  }

  return (
    <Routes>
      {/* Public route - Landing page */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
        }
      />

      {/* Public route - Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* Protected routes — redirect to /login if unauthenticated */}
      <Route
        path="/*"
        element={
          isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

// ─── App Root ──────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  );
}

export default App;
