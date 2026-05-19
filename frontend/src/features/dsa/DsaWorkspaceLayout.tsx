import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { Flame, Zap, Target, Keyboard } from 'lucide-react';

import { useXpUpdates, useStreakUpdates, useConnectionState } from '../../hooks/useSse';

import { useRuntimeState } from '../../hooks/useRuntimeState';

import { Progress, StreakBadge, XpBadge } from '../../components/ui';

import { XpPulse } from '../realtime/XpPulse';

import { cn } from '../../lib/design-system/tokens.css';

import { copy } from '../../lib/copy';

import { smooth, staggerItem, snappy } from '../../design-system/motion';



interface DsaWorkspaceLayoutProps {

  children: React.ReactNode;

  syncBar?: React.ReactNode;

}



/** Flow-focused shell: main workspace + calm sticky progression sidebar */

export function DsaWorkspaceLayout({ children, syncBar }: DsaWorkspaceLayoutProps) {

  const { data: runtimeState } = useRuntimeState();

  const { latestXp, delta } = useXpUpdates();

  const { streak: liveStreak, atRisk } = useStreakUpdates();

  const { connected, reconnecting } = useConnectionState();

  const [xpFlash, setXpFlash] = useState(false);



  const streak = liveStreak ?? runtimeState?.streak ?? 0;

  const xp = latestXp ?? runtimeState?.xp ?? 0;

  const level = runtimeState?.level ?? 1;

  const xpInLevel = runtimeState?.xpToNextLevel ? (xp % runtimeState.xpToNextLevel) : 0;

  const xpToNextLevel = runtimeState?.xpToNextLevel ?? 1000;

  const primaryMission = runtimeState?.activeGoals?.[0];

  const [showKeyboardHint, setShowKeyboardHint] = useState(false);



  // Keyboard shortcuts for flow state

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      // Press '?' to show keyboard shortcuts

      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {

        setShowKeyboardHint(prev => !prev);

      }

      // Press 'Escape' to close hints

      if (e.key === 'Escape') {

        setShowKeyboardHint(false);

      }

    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, []);



  useEffect(() => {

    if (delta && delta > 0) {

      const timer = setTimeout(() => {

        setXpFlash(true);

        setTimeout(() => setXpFlash(false), 600);

      }, 0);

      return () => clearTimeout(timer);

    }

  }, [delta]);



  const streakCopy = atRisk

    ? copy.workspace.streakAtRisk

    : streak > 0

      ? copy.workspace.streakSteady

      : copy.workspace.streakStart;



  return (

    <div className="max-w-[1600px] mx-auto px-0 sm:px-1">

      <header className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">

        <div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">

            DSA Workspace

          </h1>

          <p className="text-sm text-zinc-500 mt-1 max-w-md leading-relaxed">{copy.workspace.subtitle}</p>

        </div>

        <div className="flex items-center gap-3 flex-wrap">

          {syncBar}

          <ConnectionPill connected={connected} reconnecting={reconnecting} />

          <button

            onClick={() => setShowKeyboardHint(!showKeyboardHint)}

            className="text-xs text-zinc-500 hover:text-[#0F172A] transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-100/50"

            aria-label="Show keyboard shortcuts"

          >

            <Keyboard className="w-3.5 h-3.5" />

            <span className="hidden sm:inline">?</span>

          </button>

        </div>

      </header>



      <motion.div

        layout

        className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-4 md:gap-5"

      >

        <motion.main

          layout

          transition={smooth}

          className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 md:p-8 focus-within:ring-1 focus-within:ring-[#7C5CFF]/20 focus-within:ring-offset-2 focus-within:ring-offset-white shadow-sm"

          tabIndex={-1}

          role="main"

        >

          {children}

        </motion.main>



        <aside

          className="space-y-2.5 xl:sticky xl:top-[5rem] xl:self-start xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1 xl:scrollbar-thin xl:scrollbar-thumb-zinc-700 xl:scrollbar-track-transparent"

          aria-label="Progression"

        >

          <SidebarPanel title="Momentum" icon={<Flame className="w-3.5 h-3.5 text-orange-400" />}>

            <div className="flex items-center justify-between gap-2 mb-2">

              <StreakBadge streak={streak} />

              {atRisk && (

                <span className="text-[10px] text-amber-400/90 tracking-wide">Gentle nudge</span>

              )}

            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">{streakCopy}</p>

          </SidebarPanel>



          <SidebarPanel title="Experience" icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}>

            <div className="flex items-center justify-between mb-2">

              <XpBadge xp={xp} />

              <span className="text-xs text-zinc-500 tabular-nums">Lv {level}</span>

            </div>

            <motion.div animate={xpFlash ? { opacity: [1, 0.85, 1] } : {}} transition={{ duration: 0.4 }}>

              <Progress value={xpInLevel} max={xpToNextLevel} variant="xp" size="sm" />

            </motion.div>

            <AnimatePresence>

              {delta && delta > 0 && (

                <XpPulse

                  delta={delta}

                  className="mt-2 inline-block text-[11px] text-emerald-400/90 tabular-nums"

                />

              )}

            </AnimatePresence>

          </SidebarPanel>



          {primaryMission && (

            <SidebarPanel title="Focus" icon={<Target className="w-3.5 h-3.5 text-[#12B76A]" />}>

              <p className="text-sm text-[#0F172A] font-medium leading-snug">Goal {primaryMission.goalId}</p>

              <Progress

                className="mt-2.5"

                value={primaryMission.progress}

                max={primaryMission.target}

                size="sm"

                showLabel

                label={`${primaryMission.progress}/${primaryMission.target}`}

              />

            </SidebarPanel>

          )}



          <SessionStrip activeSlots={Math.min(5, Math.max(1, streak))} />

        </aside>

      </motion.div>



      <AnimatePresence>

        {showKeyboardHint && (

          <KeyboardShortcuts onClose={() => setShowKeyboardHint(false)} />

        )}

      </AnimatePresence>

    </div>

  );

}



function ConnectionPill({

  connected,

  reconnecting,

}: {

  connected: boolean;

  reconnecting: boolean;

}) {

  if (reconnecting) {

    return (

      <span className="text-xs text-amber-400/90 flex items-center gap-1.5">

        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />

        Reconnecting

      </span>

    );

  }

  if (!connected) return null;

  return (

    <span className="text-xs text-zinc-500 flex items-center gap-1.5">

      <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]/80" />

      {copy.workspace.live}

    </span>

  );

}



function SidebarPanel({

  title,

  icon,

  children,

}: {

  title: string;

  icon: React.ReactNode;

  children: React.ReactNode;

}) {

  return (

    <motion.div

      variants={staggerItem}

      initial="hidden"

      animate="visible"

      whileHover={{ scale: 1.01 }}

      transition={snappy}

      className="rounded-lg border border-zinc-200 bg-white p-3 hover:bg-zinc-50 transition-colors duration-200 shadow-sm"

    >

      <motion.div layout className="flex items-center gap-2 mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">

        {icon}

        {title}

      </motion.div>

      {children}

    </motion.div>

  );

}



function SessionStrip({ activeSlots }: { activeSlots: number }) {

  return (

    <div className="rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm">

      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">{copy.workspace.sessionQuiet}</p>

      <div className="flex gap-1" role="presentation">

        {[0, 1, 2, 3, 4].map((i) => (

          <motion.div

            key={i}

            layout

            transition={snappy}

            className={cn(

              'h-1 flex-1 rounded-full transition-colors duration-200',

              i < activeSlots ? 'bg-[#12B76A]/45' : 'bg-zinc-100'

            )}

          />

        ))}

      </div>

    </div>

  );

}



function KeyboardShortcuts({ onClose }: { onClose: () => void }) {

  return (

    <motion.div

      initial={{ opacity: 0, scale: 0.95 }}

      animate={{ opacity: 1, scale: 1 }}

      exit={{ opacity: 0, scale: 0.95 }}

      transition={smooth}

      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"

      onClick={onClose}

    >

      <motion.div

        className="bg-white border border-zinc-200 rounded-xl p-6 max-w-md w-full shadow-2xl"

        onClick={(e) => e.stopPropagation()}

      >

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-lg font-semibold text-[#0F172A]">Keyboard Shortcuts</h3>

          <button

            onClick={onClose}

            className="text-zinc-400 hover:text-[#0F172A] transition-colors"

            aria-label="Close"

          >

            ✕

          </button>

        </div>

        <div className="space-y-3">

          <div className="flex items-center justify-between text-sm">

            <span className="text-zinc-500">Show shortcuts</span>

            <kbd className="px-2 py-1 bg-zinc-100 rounded text-zinc-700 text-xs font-mono">?</kbd>

          </div>

          <div className="flex items-center justify-between text-sm">

            <span className="text-zinc-500">Close modal</span>

            <kbd className="px-2 py-1 bg-zinc-100 rounded text-zinc-700 text-xs font-mono">Esc</kbd>

          </div>

        </div>

      </motion.div>

    </motion.div>

  );

}

