// AppShell — Premium Engineering OS layout matching Design.pdf exactly
// Dark navy sidebar (88px collapsed / 260px expanded) + 72px sticky topbar

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Code2,
  FolderKanban,
  UserRound,
  Settings,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  X,
  Flame,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/design-system/tokens.css';
import { useSse } from '../../hooks/useSse';
import { useUIStore } from '../../store/uiStore';
import { NotificationCenter } from '../../features/notifications/NotificationCenter';
import { isFeatureEnabled } from '../../lib/feature-flags';
import { useRuntimeState } from '../../hooks/useRuntimeState';
import { useUserStore } from '../../store/userStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const coreNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { id: 'dsa', label: 'DSA', icon: <Code2 size={20} />, path: '/dsa' },
  { id: 'projects', label: 'Projects', icon: <FolderKanban size={20} />, path: '/projects' },
  { id: 'profile', label: 'Profile', icon: <UserRound size={20} />, path: '/profile' },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
];

export const AppShell = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const connectionState = useSse().connectionStatus;
  const toggleSearch = useUIStore((s) => s.toggleSearch);
  const { data: runtimeState } = useRuntimeState();
  const streak = runtimeState?.streak ?? 0;
  const user = useUserStore((s) => s.user);
  const displayName = user?.displayName || user?.username || 'Developer';

  const navItems = [
    ...coreNav,
    ...(isFeatureEnabled('admin_panel')
      ? [{ id: 'admin', label: 'Admin', icon: <Shield size={20} />, path: '/admin' } as NavItem]
      : []),
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sidebarWidth = collapsed ? 'w-[5.5rem]' : 'w-[16.25rem]';
  const mainMargin = collapsed ? 'md:ml-[5.5rem]' : 'md:ml-[16.25rem]';

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#111827] flex">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 h-screen z-40',
          'bg-white border-r border-[rgba(17,24,39,0.06)] transition-all duration-300 ease-out',
          sidebarWidth
        )}
      >
        {/* Logo */}
        <div className={cn('h-[72px] flex items-center border-b border-[rgba(17,24,39,0.06)]', collapsed ? 'px-0 justify-center' : 'px-5')}>
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(139,92,246,0.35)]">
              <Zap className="w-[18px] h-[18px] text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-[15px] tracking-tight text-[#111827] leading-none">DevTrack</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mt-0.5">Engineering OS</span>
              </div>
            )}
          </Link>
        </div>

        {/* Section label */}
        {!collapsed && (
          <div className="px-5 pt-6 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">Core Systems</span>
          </div>
        )}

        {/* Nav items */}
        <nav className={cn('flex-1 px-2.5 space-y-1', collapsed && 'pt-4')} aria-label="Main">
          {navItems.map((item) => (
            <SidebarNavLink
              key={item.id}
              item={item}
              collapsed={collapsed}
              active={location.pathname.startsWith(item.path)}
            />
          ))}
        </nav>

        {/* Streak card at bottom */}
        <div className={cn('px-3 pb-3', collapsed && 'px-2')}>
          {!collapsed ? (
            <div className="rounded-2xl bg-white border border-[rgba(17,24,39,0.06)] shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[#111827] font-bold text-sm leading-none">{streak} Day Streak</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-orange-500 mt-1">
                    Momentum {streak > 7 ? 'High' : streak > 0 ? 'Active' : 'Idle'}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1 rounded-full bg-zinc-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (streak / 30) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500">{streak}</span>
            </div>
          )}
        </div>

        {/* Profile dock */}
        {!collapsed && (
          <div className="px-3 pb-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6]/10 to-[#A78BFA]/10 border border-[#8B5CF6]/20 flex items-center justify-center">
                <span className="text-xs font-bold text-[#8B5CF6]">{displayName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-semibold text-[#111827] truncate">{displayName.length > 12 ? displayName.slice(0, 12) + '…' : displayName}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Architecture Lead</p>
              </div>
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-[rgba(17,24,39,0.1)] shadow-sm flex items-center justify-center text-zinc-400 hover:text-[#111827] hover:border-[#8B5CF6]/40 transition-all duration-200"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-[260px] bg-white z-50 md:hidden shadow-2xl"
            >
              <div className="h-[72px] flex items-center justify-between px-5 border-b border-[rgba(17,24,39,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shadow-[0_4px_16px_rgba(139,92,246,0.35)]">
                    <Zap className="w-[18px] h-[18px] text-white" />
                  </div>
                  <span className="font-bold text-[15px] text-[#111827]">DevTrack</span>
                </div>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-1.5 text-zinc-400 hover:text-[#111827]">
                  <X size={20} />
                </button>
              </div>
              <nav className="p-2.5 space-y-1 mt-2">
                {navItems.map((item) => (
                  <SidebarNavLink
                    key={item.id}
                    item={item}
                    collapsed={false}
                    active={location.pathname.startsWith(item.path)}
                  />
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className={cn('flex-1 min-h-screen flex flex-col transition-all duration-300', mainMargin)}>
        {/* ─── TOPBAR (72px sticky) ─── */}
        <header className="sticky top-0 z-30 h-[72px] bg-white/75 backdrop-blur-2xl border-b border-[rgba(17,24,39,0.06)]">
          <div className="h-full max-w-[1440px] mx-auto px-4 md:px-8 flex items-center gap-4">
            {/* Mobile menu */}
            <button
              type="button"
              className="p-2 text-zinc-500 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Search bar — centered pill */}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-2.5 flex-1 max-w-lg mx-auto px-4 py-2.5 rounded-full border border-zinc-200/80 bg-zinc-50/70 text-zinc-500 text-sm hover:border-[#8B5CF6]/25 hover:bg-[#8B5CF6]/[0.03] transition-all duration-200 shadow-sm"
            >
              <Search size={15} className="text-zinc-400" />
              <span className="text-[13px] font-medium">Show my hardest problems…</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-500 font-mono">⌘K</kbd>
            </button>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
              {/* SSE Status dot */}
              <ConnectionDot status={connectionState} />

              {/* Notifications */}
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="p-2 text-zinc-400 hover:text-[#8B5CF6] relative rounded-xl hover:bg-[#8B5CF6]/5 transition-colors duration-200"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </button>

              {/* Profile mini card */}
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="hidden md:flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-full hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-[#111827] leading-none">{displayName}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B5CF6] mt-0.5">Elite Node</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* ─── PAGE CONTENT ─── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-14 py-8 md:py-10">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ─── COMMAND PALETTE ─── */}
      <AnimatePresence>
        {commandOpen && (
          <CommandPalette
            items={navItems}
            onClose={() => setCommandOpen(false)}
            onNavigate={(path) => {
              navigate(path);
              setCommandOpen(false);
            }}
            onSearch={toggleSearch}
          />
        )}
      </AnimatePresence>

      <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
};

/* ─── Sidebar Nav Link ─── */
function SidebarNavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      to={item.path}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
        active
          ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
          : 'text-zinc-500 hover:text-[#111827] hover:bg-zinc-50',
        collapsed && 'justify-center px-0 mx-1'
      )}
    >
      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#8B5CF6]"
          transition={{ type: 'spring', damping: 30, stiffness: 500 }}
        />
      )}
      <span className={cn(active ? 'text-[#8B5CF6]' : 'text-zinc-500', 'transition-colors')}>{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/* ─── Connection status dot for topbar ─── */
function ConnectionDot({ status }: { status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' }) {
  if (status === 'connected') return null;
  const color = status === 'reconnecting' || status === 'connecting' ? 'bg-[#F59E0B]' : 'bg-zinc-400';
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium text-zinc-500">
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', color)} />
      {status === 'reconnecting' ? 'Reconnecting…' : status === 'connecting' ? 'Connecting…' : 'Offline'}
    </div>
  );
}

/* ─── Command Palette ─── */
function CommandPalette({
  items,
  onClose,
  onNavigate,
  onSearch,
}: {
  items: NavItem[];
  onClose: () => void;
  onNavigate: (path: string) => void;
  onSearch: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/15 backdrop-blur-md flex items-start justify-center pt-[16vh] px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="w-full max-w-lg bg-white border border-zinc-200/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
          <Search size={18} className="text-[#8B5CF6] shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where do you want to go?"
            className="flex-1 bg-transparent outline-none text-sm text-[#111827] placeholder:text-zinc-400 font-medium"
          />
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-2 max-h-72 overflow-y-auto">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-600 hover:text-[#111827] hover:bg-zinc-50 transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">No matches</p>
          )}
        </div>
        <div className="px-4 py-3 border-t border-zinc-100 text-xs text-zinc-500 bg-zinc-50/50">
          <button type="button" onClick={onSearch} className="hover:text-[#8B5CF6] font-semibold transition-colors">
            Advanced search
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AppShell;
