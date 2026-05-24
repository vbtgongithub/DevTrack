// src/features/gamification/hooks/useOverlayQueue.ts — Overlay queue system wrapper
// Bridges the legacy hook API to the new centralized Zustand overlayStore.


import { useOverlayStore, type OverlayType, type OverlayItem } from '../../../store/overlayStore';

export type { OverlayType, OverlayItem };

export function useOverlayQueue() {
  const queue = useOverlayStore((s) => s.queue);
  const activeOverlay = useOverlayStore((s) => s.activeOverlay);
  const enqueue = useOverlayStore((s) => s.enqueue);
  const dismiss = useOverlayStore((s) => s.dismiss);
  const clearQueue = useOverlayStore((s) => s.clearQueue);

  return {
    activeOverlay,
    queue,
    enqueue,
    dismiss,
    clearQueue,
  };
}

