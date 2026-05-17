import React from 'react';
import type { TopbarProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';
import { motion, AnimatePresence } from 'framer-motion';

export const Topbar: React.FC<TopbarProps> = ({
  data,
  onNotificationsClick,
  onProfileClick,
  onSearchClick,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);
  const placeholders = [
    "Analyze my weakest topics...",
    "Show my hardest problems...",
    "What was my best coding day?",
    "Generate weekly report...",
    "Show GitHub trends..."
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-20 bg-transparent flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0 dt-transition-slow">
      {/* ─── AI Command Center ─── */}
      <div className="relative group w-full sm:w-[520px] max-w-full">
        <motion.div
          animate={{
            scale: isFocused ? 1.02 : 1,
            boxShadow: isFocused
              ? '0 20px 50px rgba(124, 92, 252, 0.15), 0 0 0 1px rgba(124, 92, 252, 0.3)'
              : '0 8px 30px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(124, 92, 252, 0.1)'
          }}
          className="relative dt-radius-xl bg-white/60 backdrop-blur-[30px] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-4 dt-transition-slow overflow-hidden"
        >
          {/* Inner Glow Architecture */}
          <div className="absolute inset-0 bg-gradient-to-tr from-dt-primary/[0.03] via-transparent to-dt-secondary/[0.03] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,92,252,0.05),transparent_70%)] pointer-events-none" />

          <Icon
            name="search"
            size={18}
            className={[
              'relative z-10 dt-transition-slow',
              isFocused ? 'text-dt-primary scale-110' : 'text-dt-textSecondary/40'
            ].join(' ')}
          />

          <div className="relative z-10 flex-1 min-w-0">
            <input
              className="w-full bg-transparent outline-none text-[14px] sm:text-[15px] font-medium text-dt-text placeholder:text-dt-textSecondary/30"
              onFocus={() => { setIsFocused(true); onSearchClick?.(); }}
              onBlur={() => setIsFocused(false)}
              aria-label="AI Command Center"
              placeholder=""
            />
            <AnimatePresence mode="wait">
              {!isFocused && (
                <motion.div
                  key={placeholderIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0 pointer-events-none flex items-center"
                >
                  <span className="text-[14px] sm:text-[15px] font-medium text-dt-textSecondary/30 truncate">
                    {placeholders[placeholderIndex]}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden sm:flex relative z-10 items-center gap-1.5 px-2.5 py-1.5 dt-radius-md bg-white/80 border border-dt-primary/10 shadow-sm">
            <span className="text-[10px] font-bold text-dt-textSecondary/60 tracking-widest">⌘K</span>
          </div>
        </motion.div>

        {/* Decorative Focus Ring */}
        {isFocused && (
          <motion.div
            layoutId="command-glow"
            className="absolute -inset-1 dt-radius-xl bg-dt-primary/10 blur-xl -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>

      {/* ─── Action Suite ─── */}
      <div className="flex items-center gap-3 sm:gap-6 ml-4 sm:ml-0">
        <button
          type="button"
          onClick={onNotificationsClick}
          className="w-10 h-10 sm:w-12 sm:h-12 dt-radius-lg sm:dt-radius-xl flex items-center justify-center text-dt-textSecondary dt-transition-slow hover:bg-white hover:shadow-dt-floating hover:text-dt-primary border border-transparent hover:border-dt-primary/10 relative group"
          aria-label="Notifications"
        >
          <Icon name="bell" size={20} className="group-hover:scale-110 dt-transition-slow" />
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-1.5 h-1.5 sm:w-2 sm:h-2 dt-radius-full bg-rose-500 border-2 border-white shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
        </button>

        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-3 pl-1.5 pr-1.5 sm:pl-2 sm:pr-5 py-1.5 sm:py-2 dt-radius-xl sm:dt-radius-2xl hover:bg-white hover:shadow-dt-floating dt-transition-slow border border-transparent hover:border-dt-primary/10 group bg-white/40"
          aria-label="Profile"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 dt-radius-xl flex items-center justify-center bg-white border border-dt-primary/5 overflow-hidden shadow-sm group-hover:border-dt-primary/20 dt-transition-slow relative">
            <div className="absolute inset-0 bg-dt-primary/5 opacity-0 group-hover:opacity-100 dt-transition-normal" />
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="h-full w-full object-cover relative z-10" />
            ) : (
              <Icon name="user" size={18} className="text-dt-textSecondary relative z-10" />
            )}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <div className="text-[13px] font-bold text-dt-text tracking-tight">{data.displayName}</div>
            <div className="text-label text-[8px] !text-dt-primary/70">Elite Node</div>
          </div>
        </button>
      </div>

      <span className="hidden" aria-hidden="true">
        {data.currentPageTitle}
      </span>
    </header>
  );
};
