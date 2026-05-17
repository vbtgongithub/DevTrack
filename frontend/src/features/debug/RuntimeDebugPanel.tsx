import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, Activity, Wifi, Clock, Zap, Shield, RefreshCw } from 'lucide-react';
import { useRuntimeState, type RuntimeState } from '../../hooks/useRuntimeState';
import { useSse, type SseDiagnostics, type SseEvent } from '../../hooks/useSse';
import { cn } from '../../lib/design-system/tokens.css';
import { springCalm } from '../../lib/motion';
import { useUserStore } from '../../store/userStore';

interface RuntimeDebugPanelProps {
  /** Only renders in development or when feature flag is enabled */
  enabled?: boolean;
}

/**
 * RuntimeDebugPanel — Development overlay for runtime state inspection
 * Shows live runtime state, SSE diagnostics, and event history.
 * Only visible in development mode or when explicitly enabled.
 */
export function RuntimeDebugPanel({ enabled = import.meta.env.DEV }: RuntimeDebugPanelProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'state' | 'sse' | 'events'>('state');
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const { data: runtimeState, loading, error } = useRuntimeState();
  const { connectionStatus, diagnostics, eventHistory, reconnectAttempt } = useSse({ enabled: isAuthenticated });

  if (!enabled) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-[60] p-2.5 rounded-full shadow-lg transition-all duration-200',
          'bg-zinc-800/90 border border-zinc-700/60 hover:bg-zinc-700/90 hover:border-zinc-600',
          'text-zinc-400 hover:text-zinc-200',
          open && 'hidden'
        )}
        aria-label="Open runtime diagnostics panel"
        title="Runtime Diagnostics Panel"
      >
        <Bug className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={springCalm}
            className="fixed bottom-4 right-4 z-[60] w-[420px] max-h-[80vh] bg-zinc-900/95 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-zinc-200">Runtime Diagnostics</span>
                <ConnectionDot status={connectionStatus} />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800/60">
              {(['state', 'sse', 'events'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                    activeTab === tab
                      ? 'text-emerald-400 border-b-2 border-emerald-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {tab === 'state' ? 'State' : tab === 'sse' ? 'SSE' : 'Events'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {activeTab === 'state' && (
                <StateTab state={runtimeState} loading={loading} error={error} />
              )}
              {activeTab === 'sse' && (
                <SseTab
                  status={connectionStatus}
                  diagnostics={diagnostics}
                  reconnectAttempt={reconnectAttempt}
                />
              )}
              {activeTab === 'events' && <EventsTab events={eventHistory} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ConnectionDot({ status }: { status: string }) {
  const color =
    status === 'connected'
      ? 'bg-emerald-500'
      : status === 'reconnecting' || status === 'connecting'
        ? 'bg-amber-500 animate-pulse'
        : 'bg-red-500';
  return <span className={cn('w-2 h-2 rounded-full', color)} title={status} />;
}

function StateTab({
  state,
  loading,
  error,
}: {
  state: RuntimeState | undefined;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <p className="text-xs text-zinc-500 py-4 text-center">Loading runtime state…</p>;
  }
  if (error) {
    return <p className="text-xs text-red-400 py-4 text-center">{error}</p>;
  }
  if (!state) {
    return <p className="text-xs text-zinc-500 py-4 text-center">No runtime state available</p>;
  }

  return (
    <div className="space-y-3">
      <DebugSection title="Core Progression" icon={<Zap className="w-3 h-3 text-amber-400" />}>
        <DebugRow label="XP" value={state.xp.toLocaleString()} />
        <DebugRow label="Level" value={state.level} />
        <DebugRow label="XP to Next" value={state.xpToNextLevel} />
        <DebugRow label="Streak" value={`${state.streak} days`} />
        <DebugRow label="Longest Streak" value={`${state.longestStreak} days`} />
        <DebugRow label="Streak Risk" value={`${(state.streakRisk * 100).toFixed(0)}%`} />
        <DebugRow label="Days Active" value={state.daysActive} />
        <DebugRow label="Problems Solved" value={state.totalProblemsSolved} />
      </DebugSection>

      <DebugSection title="Behavioral State" icon={<Activity className="w-3 h-3 text-violet-400" />}>
        <DebugRow label="Momentum" value={state.momentumState} />
        <DebugRow label="Fatigue" value={state.fatigueState} />
        <DebugRow label="Emotional" value={state.emotionalState} />
        <DebugRow label="Recovery" value={state.recoveryState} />
        <DebugRow label="Trust Score" value={`${(state.trustScore * 100).toFixed(0)}%`} />
        <DebugRow label="Engagement" value={state.engagementPressure} />
        <DebugRow label="Onboarding" value={state.onboardingStage} />
      </DebugSection>

      <DebugSection title="Active Systems" icon={<Shield className="w-3 h-3 text-emerald-400" />}>
        <DebugRow label="Goals" value={state.activeGoals?.length ?? 0} />
        <DebugRow label="Challenges" value={state.activeChallenges?.length ?? 0} />
        <DebugRow label="Achievements" value={state.activeAchievements?.length ?? 0} />
        <DebugRow label="Near Milestones" value={state.nearMilestones?.length ?? 0} />
        <DebugRow label="Recent Milestones" value={state.recentMilestones?.length ?? 0} />
      </DebugSection>

      <DebugSection title="Session" icon={<Clock className="w-3 h-3 text-cyan-400" />}>
        <DebugRow label="Active" value={state.sessionContext?.isActive ? 'Yes' : 'No'} />
        <DebugRow label="Session XP" value={state.sessionContext?.xpThisSession ?? 0} />
        <DebugRow label="Session Problems" value={state.sessionContext?.problemsThisSession ?? 0} />
      </DebugSection>

      {state.currentMessage && (
        <DebugSection title="Current Message" icon={<Activity className="w-3 h-3 text-orange-400" />}>
          <DebugRow label="Tone" value={state.currentMessage.tone} />
          <DebugRow label="Text" value={state.currentMessage.text} mono={false} />
        </DebugSection>
      )}

      <DebugSection title="Metadata" icon={<RefreshCw className="w-3 h-3 text-zinc-400" />}>
        <DebugRow label="Version" value={state.version} />
        <DebugRow label="Last Event" value={state.lastEventId || '(none)'} />
        <DebugRow label="Calculated" value={new Date(state.lastCalculatedAt).toLocaleTimeString()} />
        <DebugRow label="Updated" value={new Date(state.updatedAt).toLocaleTimeString()} />
      </DebugSection>
    </div>
  );
}

function SseTab({
  status,
  diagnostics,
  reconnectAttempt,
}: {
  status: string;
  diagnostics: SseDiagnostics;
  reconnectAttempt: number;
}) {
  return (
    <div className="space-y-3">
      <DebugSection title="Connection" icon={<Wifi className="w-3 h-3 text-emerald-400" />}>
        <DebugRow label="Status" value={status} />
        <DebugRow label="Reconnect Attempts" value={reconnectAttempt} />
        <DebugRow label="Consecutive Failures" value={diagnostics.consecutiveFailures} />
        <DebugRow label="Total Reconnects" value={diagnostics.totalReconnects} />
        <DebugRow label="Avg Reconnect Delay" value={`${diagnostics.avgReconnectDelay}ms`} />
      </DebugSection>

      <DebugSection title="Events" icon={<Activity className="w-3 h-3 text-violet-400" />}>
        <DebugRow label="Total Received" value={diagnostics.totalEventsReceived} />
        <DebugRow
          label="Connected At"
          value={diagnostics.connectedAt ? new Date(diagnostics.connectedAt).toLocaleTimeString() : '—'}
        />
        <DebugRow
          label="Last Event At"
          value={diagnostics.lastEventAt ? new Date(diagnostics.lastEventAt).toLocaleTimeString() : '—'}
        />
      </DebugSection>
    </div>
  );
}

function EventsTab({ events }: { events: SseEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-zinc-500 py-4 text-center">No events received yet</p>;
  }

  return (
    <div className="space-y-1.5">
      {events.slice(0, 25).map((event, i) => (
        <div
          key={`${event.type}-${event.timestamp}-${i}`}
          className="p-2 rounded bg-zinc-800/40 border border-zinc-800/30"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-medium text-emerald-400">{event.type}</span>
            <span className="text-[10px] text-zinc-600 tabular-nums">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
          {event.stats && Object.keys(event.stats).length > 0 && (
            <pre className="text-[10px] text-zinc-500 font-mono overflow-hidden text-ellipsis max-h-12">
              {JSON.stringify(event.stats, null, 1)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

function DebugSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/40 bg-zinc-800/20 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/30">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{title}</span>
      </div>
      <div className="px-3 py-2 space-y-1">{children}</div>
    </div>
  );
}

function DebugRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-zinc-500">{label}</span>
      <span className={cn('text-zinc-300', mono && 'font-mono tabular-nums')}>{String(value)}</span>
    </div>
  );
}
