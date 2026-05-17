type TelemetryEvent = {
  name: string;
  properties?: Record<string, unknown>;
  ts: number;
};

const buffer: TelemetryEvent[] = [];
const MAX_BUFFER = 100;

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.debug('[telemetry]', name, properties);
  }
  buffer.push({ name, properties, ts: Date.now() });
  if (buffer.length > MAX_BUFFER) buffer.shift();
}

export function initTelemetry(): void {
  trackEvent('app.init', { env: import.meta.env.MODE });

  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming;
            trackEvent('perf.navigation', {
              domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
              load: Math.round(nav.loadEventEnd),
            });
          }
        }
      });
      obs.observe({ type: 'navigation', buffered: true });
    } catch {
      /* optional */
    }
  }
}

export function getTelemetryBuffer(): readonly TelemetryEvent[] {
  return buffer;
}
