import { useEffect, useState, useRef } from 'react';

import { useUserStore } from '../store/userStore';

import { useRealtimeFeedback } from '../hooks/useRealtimeFeedback';
import { AchievementReveal } from '../features/realtime/AchievementReveal';
import { BehavioralMessageBar } from '../features/realtime/BehavioralMessageBar';
import { RecoveryOverlay } from '../features/realtime/RecoveryOverlay';
import { useUIStore } from '../store/uiStore';

/** Global realtime polish: calm toasts + achievement reveal + behavioral messaging */
export function RealtimeLayer() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  useRealtimeFeedback(isAuthenticated);

  const [reveal, setReveal] = useState<{ name: string; rarity?: string } | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  // Receive last SSE event via UI store (updated by AppProviders' single useSse)
  const lastSseEvent = useUIStore((s) => (s as any).lastSseEvent) as
    | { type: string; timestamp: string; stats?: { name?: string; rarity?: string } }
    | undefined;

  useEffect(() => {
    if (!isAuthenticated || !lastSseEvent) return;

    const { type, timestamp, stats } = lastSseEvent;
    if (type !== 'badge_earned' && type !== 'achievement_unlocked') return;

    const name = stats?.name;
    if (!name) return;

    const key = `${timestamp}:${name}`;
    if (seenRef.current.has(key)) return;
    seenRef.current.add(key);

    setReveal({ name, rarity: stats?.rarity });
  }, [isAuthenticated, lastSseEvent]);




  return (
    <>
      <BehavioralMessageBar />
      <RecoveryOverlay />
      <AchievementReveal
        open={Boolean(reveal)}
        name={reveal?.name}
        rarity={reveal?.rarity}
        onDismiss={() => setReveal(null)}
      />
    </>
  );
}

