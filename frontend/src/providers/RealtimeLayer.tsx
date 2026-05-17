import { useState, useRef } from 'react';
import { useUserStore } from '../store/userStore';
import { useRealtimeFeedback } from '../hooks/useRealtimeFeedback';
import { useSse } from '../hooks/useSse';
import { AchievementReveal } from '../features/realtime/AchievementReveal';
import { BehavioralMessageBar } from '../features/realtime/BehavioralMessageBar';
import { RecoveryOverlay } from '../features/realtime/RecoveryOverlay';

/** Global realtime polish: calm toasts + achievement reveal + behavioral messaging */
export function RealtimeLayer() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  useRealtimeFeedback(isAuthenticated);

  const [reveal, setReveal] = useState<{ name: string; rarity?: string } | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  useSse({
    enabled: isAuthenticated,
    onEvent: (event) => {
      if (event.type === 'badge_earned' || event.type === 'achievement_unlocked') {
        // Achievement events have custom data structure
        const achievementData = event.stats as { name?: string; rarity?: string } | undefined;
        const name = achievementData?.name;
        if (name) {
          const key = `${event.timestamp}:${name}`;
          if (seenRef.current.has(key)) return;
          seenRef.current.add(key);
          setReveal({ name, rarity: achievementData?.rarity });
        }
      }
    },
  });

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
