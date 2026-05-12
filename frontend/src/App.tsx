import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastContainer } from './components/shared/ToastContainer';
import { useUserStore } from './store/userStore';
import { useDashboardData } from './hooks/useDashboardData';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { AppRouter } from './router';
import type { SidebarNavItemVM, TopbarVM } from './types/vm.types';

// ─── Navigation Config ─────────────────────────────────────────────────────
const NAV_ITEMS: Omit<SidebarNavItemVM, 'isActive'>[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard', badge: null },
  { id: 'dsa', label: 'DSA', icon: 'code-bracket', path: '/dsa', badge: null },
  { id: 'projects', label: 'Projects', icon: 'folder', path: '/projects', badge: null },
  { id: 'profile', label: 'Profile', icon: 'user', path: '/profile', badge: null },
  { id: 'settings', label: 'Settings', icon: 'cog', path: '/settings', badge: null },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dsa': 'DSA Tracker',
  '/projects': 'Projects',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

// ─── Page Transition Wrapper ──────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
} as const;

// ─── Boot Splash (shown while hydrating auth state) ────────────────────────
const BootSplash: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-dt-bg">
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
  const { data: dashboardData } = useDashboardData();

  // Memoize nav items to prevent sidebar re-renders on every location change
  const navItems: SidebarNavItemVM[] = React.useMemo<SidebarNavItemVM[]>(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        isActive: location.pathname === item.path,
      })),
    [location.pathname]
  );

  const currentPageTitle = PAGE_TITLES[location.pathname] || 'DevTrack';

  const topbarData: TopbarVM = React.useMemo<TopbarVM>(
    () => ({
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
    }),
    [user, currentPageTitle, location.pathname]
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="flex min-h-screen w-full bg-dt-bg text-dt-text overflow-hidden"
      >
        <Sidebar
          navItems={navItems}
          isCollapsed={false}
          onToggleCollapse={() => undefined}
          currentPath={location.pathname}
          onNavigate={(path) => navigate(path)}
          streak={dashboardData?.streakData?.currentStreak ?? 0}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar
            data={topbarData}
            onNotificationsClick={() => { }}
            onProfileClick={() => navigate('/settings')}
            onSearchClick={() => { }}
          />

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            <AppRouter />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Auth Gate (root router) ───────────────────────────────────────────────
const AuthGate: React.FC = () => {
  const status = useUserStore((s) => s.status);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const hydrate = useUserStore((s) => s.hydrate);

  // Mark as hydrated on first render so we never show inconsistent SSR vs client HTML
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    hydrate().then(() => setHydrated(true));
  }, [hydrate]);

  // Show boot splash until hydration is complete — avoids hydration mismatch
  if (!hydrated || status === 'idle' || status === 'loading') {
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
      <ToastContainer />
      <AuthGate />
    </BrowserRouter>
  );
}

export default App;
