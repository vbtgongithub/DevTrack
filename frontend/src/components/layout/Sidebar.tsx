import React from 'react';
import type { SidebarProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';
import { motion } from 'framer-motion';

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
  profile,
  streak,
}) => {
  return (
    <aside className="w-[260px] xl:w-[280px] flex-col hidden lg:flex relative z-40 py-6 px-4 border-r border-dt-primary/[0.04] bg-white/40 backdrop-blur-[30px]">
      {/* ─── Brand & Workspace ─── */}
      <div className="px-3 mb-8 shrink-0">
        <div className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-white/60 transition-all duration-300">
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-dt-primary to-dt-secondary text-white shadow-dt-glow group-hover:scale-110 transition-transform duration-500">
            <Icon name="bolt" size={20} />
          </div>
          <div className="flex flex-col">
            <div className="text-[18px] font-black tracking-tighter text-dt-text flex items-center gap-1.5">
              DevTrack
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="text-[10px] font-bold text-dt-textSecondary/40 uppercase tracking-[0.2em]">Engineering OS</div>
          </div>
        </div>
      </div>

      {/* ─── Main Navigation ─── */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-1">
        <div className="text-[9px] font-black text-dt-textSecondary/30 uppercase tracking-[0.25em] px-4 mb-4">Core Systems</div>
        <ul className="space-y-1.5">
          {navItems.map((item) => (
            <li key={item.id} className="relative">
              <button
                type="button"
                onClick={() => onNavigate(item.path)}
                className={[
                  'group w-full flex items-center gap-4 px-4 py-3 rounded-[20px] text-left transition-all duration-500 relative overflow-hidden focus-visible:ring-2 focus-visible:ring-dt-primary focus-visible:ring-offset-2 outline-none',
                  item.isActive
                    ? 'bg-white shadow-dt-card border border-dt-primary/5 text-dt-primary'
                    : 'text-dt-textSecondary/60 hover:bg-white/50 hover:text-dt-text',
                ].join(' ')}
              >
                {item.isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-gradient-to-r from-dt-primary/[0.03] to-transparent pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}

                <div
                  className={[
                    'h-9 w-9 rounded-[14px] flex items-center justify-center transition-all duration-500 shrink-0 relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(124,92,252,0.15)]',
                    item.isActive
                      ? 'bg-dt-primary/10 text-dt-primary shadow-[inset_0_1px_2px_rgba(124,92,252,0.2)]'
                      : 'bg-transparent text-dt-textMuted group-hover:bg-dt-primary/5 group-hover:text-dt-primary',
                  ].join(' ')}
                >
                  <Icon
                    name={item.icon}
                    size={19}
                    className="relative z-10 transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                <span className="truncate text-[14px] font-bold tracking-tight relative z-10">
                  {item.label}
                </span>

                {item.isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-dt-primary shadow-[0_0_12px_rgba(124,92,252,0.8)]"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* ─── Premium Streak Widget ─── */}
        <div className="mt-10 px-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-[24px] p-5 border border-amber-200/20 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Icon name="flame" size={16} />
              </div>
              <div className="flex flex-col">
                <div className="text-[14px] font-black text-dt-text tracking-tight">{streak ?? 0} Day Streak</div>
                <div className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest">
                  {streak && streak > 0 ? 'Momentum High' : 'Start Your Journey'}
                </div>
              </div>
            </div>
            <div className="h-1.5 w-full bg-amber-200/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '85%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Profile & Meta ─── */}
      <div className="mt-auto pt-6 px-1 shrink-0">
        <button
          className="w-full flex items-center gap-4 p-3 rounded-[24px] bg-white border border-dt-primary/5 hover:border-dt-primary/20 transition-all duration-500 shadow-dt-card hover:shadow-dt-floating group"
          onClick={() => onNavigate('/settings')}
        >
          {/* Profile Completion Ring */}
          <div className="relative shrink-0">
            <svg className="w-12 h-12 -rotate-90">
              <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" className="text-dt-primary/5" />
              <motion.circle
                cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray="132"
                initial={{ strokeDashoffset: 132 }}
                animate={{ strokeDashoffset: 132 * (1 - 0.85) }}
                className="text-dt-primary"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center p-1.5">
              <div className="w-full h-full rounded-full border-2 border-white bg-white overflow-hidden shadow-sm">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-dt-primary/5 flex items-center justify-center">
                    <Icon name="user" size={16} className="text-dt-primary/40" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="text-[14px] font-black text-dt-text truncate tracking-tight group-hover:text-dt-primary transition-colors">{profile?.displayName ?? 'Varshith Reddy'}</div>
            <div className="text-[10px] font-bold text-dt-textSecondary/40 truncate tracking-[0.2em] uppercase mt-0.5">Architecture Lead</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-dt-bg flex items-center justify-center group-hover:bg-dt-primary/10 transition-colors">
             <Icon name="chevron-right" size={16} className="text-dt-textMuted/40 group-hover:text-dt-primary transition-colors duration-500 group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>

      <button type="button" onClick={onToggleCollapse} className="hidden" aria-hidden="true">
        {isCollapsed ? 'expand' : 'collapse'}
      </button>
    </aside>
  );
};
