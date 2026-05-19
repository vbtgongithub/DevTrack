/* eslint-disable */
// ============================================================================
// performance.ts — Performance Optimization Utilities
// ============================================================================
// Utilities for optimizing React performance.
// ============================================================================

import { useCallback, useEffect, useRef, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Debounce
// ---------------------------------------------------------------------------

/**
 * Debounce a function
 * 
 * @example
 * const debouncedSearch = useDebounce((query) => search(query), 300);
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

// ---------------------------------------------------------------------------
// Throttle
// ---------------------------------------------------------------------------

/**
 * Throttle a function
 * 
 * @example
 * const throttledScroll = useThrottle((e) => handleScroll(e), 100);
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  );
}

// ---------------------------------------------------------------------------
// Stable Callback
// ---------------------------------------------------------------------------

/**
 * Create a stable callback reference
 * 
 * @example
 * const handleClick = useStableCallback(() => {
 *   // Uses latest props/state but reference never changes
 * });
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

// ---------------------------------------------------------------------------
// Previous Value
// ---------------------------------------------------------------------------

/**
 * Get previous value
 * 
 * @example
 * const prevCount = usePrevious(count);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ---------------------------------------------------------------------------
// Intersection Observer
// ---------------------------------------------------------------------------

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /**
   * Callback when element intersects
   */
  onIntersect?: (entry: IntersectionObserverEntry) => void;
  
  /**
   * Only trigger once
   * @default false
   */
  once?: boolean;
}

/**
 * Intersection observer hook
 * 
 * @example
 * const ref = useIntersectionObserver({
 *   onIntersect: () => loadMore(),
 *   rootMargin: '100px',
 * });
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const { onIntersect, once = false, ...observerOptions } = options;
  const ref = useRef<T>(null);
  const hasIntersected = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (once && hasIntersected.current) return;
          
          hasIntersected.current = true;
          onIntersect?.(entry);
          
          if (once) {
            observer.disconnect();
          }
        }
      },
      observerOptions
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [onIntersect, once, observerOptions]);

  return ref;
}

// ---------------------------------------------------------------------------
// Render Count
// ---------------------------------------------------------------------------

/**
 * Track render count (development only)
 * 
 * @example
 * useRenderCount('MyComponent');
 */
export function useRenderCount(componentName: string): void {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (import.meta.env.DEV) {
      console.log(`[${componentName}] Render count: ${renderCount.current}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Why Did You Update
// ---------------------------------------------------------------------------

/**
 * Debug why component re-rendered (development only)
 * 
 * @example
 * useWhyDidYouUpdate('MyComponent', { prop1, prop2 });
 */
export function useWhyDidYouUpdate(
  componentName: string,
  props: Record<string, any>
): void {
  const previousProps = useRef<Record<string, any> | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current && import.meta.env.DEV) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[${componentName}] Changed props:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// ---------------------------------------------------------------------------
// Memoized Derived State
// ---------------------------------------------------------------------------

/**
 * Memoize expensive computations
 * 
 * @example
 * const sortedItems = useMemoizedDerivedState(
 *   () => items.sort((a, b) => a.name.localeCompare(b.name)),
 *   [items]
 * );
 */
export function useMemoizedDerivedState<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

// ---------------------------------------------------------------------------
// Animation Frame
// ---------------------------------------------------------------------------

/**
 * Request animation frame hook
 * 
 * @example
 * const animate = useAnimationFrame((time) => {
 *   // Animation logic
 * });
 */
export function useAnimationFrame(
  callback: (time: number) => void,
  enabled = true
): void {
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        callback(time);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, enabled]);
}
