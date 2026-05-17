import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackHesitation,
  trackAbandonment,
  trackWorkspaceInterruption,
} from '../lib/telemetry/analytics';

/**
 * Custom hook to automatically observe user behavior, friction,
 * hesitation, idle abandonment, and workspace interruptions in real-time.
 */
export function useUserObservation(isAuthenticated: boolean) {
  const location = useLocation();
  const pageEnterTime = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<number | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  // 1. Interruption Tracking (Quick page leaving / distraction within 15 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    pageEnterTime.current = Date.now();

    return () => {
      const timeSpent = Date.now() - pageEnterTime.current;
      if (timeSpent < 15000) {
        // User left this page extremely fast - indicating potential distraction or friction
        trackWorkspaceInterruption(location.pathname, {
          timeSpentMs: timeSpent,
          reason: 'rapid_page_departure',
        });
      }
    };
  }, [location.pathname, isAuthenticated]);

  // 2. Idle Abandonment Tracking (No user activity for 2 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current);
      }

      idleTimeoutRef.current = window.setTimeout(() => {
        trackAbandonment(location.pathname, {
          idleDurationMs: 120000,
          reason: 'user_idle_abandonment',
        });
      }, 120000); // 2 minutes
    };

    // Listen to user actions to keep resetting the idle timer
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);

    resetIdleTimer();

    return () => {
      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current);
      }
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keypress', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
    };
  }, [location.pathname, isAuthenticated]);

  // 3. Hover Hesitation Tracking (Dwell on button/card for >3s without clicking)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Only inspect button, input, link, card, or specific devtrack metric elements
      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.closest('.dt-btn') ||
        target.closest('.dt-card') ||
        target.closest('[data-testid]') ||
        target.closest('.metric-container');

      if (!isInteractive) {
        clearHoverTimer();
        return;
      }

      // If we are already hovering over the same element, ignore
      const interactiveEl = (target.closest('.dt-btn') ||
        target.closest('.dt-card') ||
        target.closest('[data-testid]') ||
        target.closest('.metric-container') ||
        target) as HTMLElement;

      if (hoveredElementRef.current === interactiveEl) return;

      clearHoverTimer();
      hoveredElementRef.current = interactiveEl;

      hoverTimeoutRef.current = window.setTimeout(() => {
        if (hoveredElementRef.current) {
          const elementLabel =
            hoveredElementRef.current.getAttribute('aria-label') ||
            hoveredElementRef.current.innerText?.slice(0, 30) ||
            hoveredElementRef.current.id ||
            hoveredElementRef.current.tagName;

          trackHesitation(elementLabel, {
            path: location.pathname,
            dwellTimeMs: 3000,
          });
        }
      }, 3000); // 3 seconds hesitation
    };

    const handleMouseOut = () => {
      clearHoverTimer();
    };

    const handleMouseClick = () => {
      // If user clicks, they are not hesitating anymore
      clearHoverTimer();
    };

    const clearHoverTimer = () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      hoveredElementRef.current = null;
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleMouseClick);

    return () => {
      clearHoverTimer();
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleMouseClick);
    };
  }, [location.pathname, isAuthenticated]);
}
