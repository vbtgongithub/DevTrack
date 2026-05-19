// ============================================================================
// lazyLoad.tsx — Route-Level Lazy Loading Utilities
// ============================================================================
// Utilities for code-splitting and lazy loading with loading states.
// ============================================================================

import React, { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';
import { PageLoader } from '../components/ui/PageLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LazyLoadOptions {
  /**
   * Fallback component while loading
   */
  fallback?: React.ReactNode;
  
  /**
   * Minimum loading time (ms) to prevent flash
   * @default 300
   */
  minLoadTime?: number;
}

// ---------------------------------------------------------------------------
// Lazy Load with Suspense
// ---------------------------------------------------------------------------

/**
 * Lazy load a component with automatic Suspense boundary
 * 
 * @example
 * const ProjectsPage = lazyLoad(() => import('./pages/ProjectsPage'));
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): React.FC<React.ComponentProps<T>> {
  const {
    fallback = <PageLoader />,
    minLoadTime = 300,
  } = options;

  // Add minimum load time to prevent flash
  const delayedImport = () =>
    Promise.all([
      importFunc(),
      new Promise((resolve) => setTimeout(resolve, minLoadTime)),
    ]).then(([module]) => module);

  const LazyComponent = lazy(delayedImport);

  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Preload Utilities
// ---------------------------------------------------------------------------

/**
 * Preload a lazy component
 * 
 * @example
 * const ProjectsPage = lazyLoad(() => import('./pages/ProjectsPage'));
 * preloadComponent(ProjectsPage);
 */
export function preloadComponent<T extends ComponentType<any>>(
  LazyComponent: React.LazyExoticComponent<T>
): void {
  // @ts-ignore - accessing internal _ctor
  if (LazyComponent._ctor) {
    // @ts-ignore
    LazyComponent._ctor();
  }
}

/**
 * Preload on hover
 * 
 * @example
 * <Link to="/projects" {...preloadOnHover(ProjectsPage)}>
 *   Projects
 * </Link>
 */
export function preloadOnHover<T extends ComponentType<any>>(
  LazyComponent: React.LazyExoticComponent<T>
) {
  return {
    onMouseEnter: () => preloadComponent(LazyComponent),
    onFocus: () => preloadComponent(LazyComponent),
  };
}

/**
 * Preload on viewport intersection
 * 
 * @example
 * const ref = usePreloadOnIntersection(ProjectsPage);
 * <div ref={ref}>...</div>
 */
export function usePreloadOnIntersection<T extends ComponentType<any>>(
  LazyComponent: React.LazyExoticComponent<T>,
  options: IntersectionObserverInit = {}
) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preloadComponent(LazyComponent);
          observer.disconnect();
        }
      },
      { rootMargin: '50px', ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [LazyComponent, options]);

  return ref;
}

// ---------------------------------------------------------------------------
// Retry Logic
// ---------------------------------------------------------------------------

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Lazy load with retry logic
 * 
 * @example
 * const ProjectsPage = lazyLoadWithRetry(() => import('./pages/ProjectsPage'));
 */
export function lazyLoadWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions & RetryOptions = {}
): React.FC<React.ComponentProps<T>> {
  const {
    fallback = <PageLoader />,
    minLoadTime = 300,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const retryImport = async (retriesLeft = maxRetries): Promise<{ default: T }> => {
    try {
      return await importFunc();
    } catch (error) {
      if (retriesLeft === 0) {
        throw error;
      }
      
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return retryImport(retriesLeft - 1);
    }
  };

  const delayedImport = () =>
    Promise.all([
      retryImport(),
      new Promise((resolve) => setTimeout(resolve, minLoadTime)),
    ]).then(([module]) => module);

  const LazyComponent = lazy(delayedImport);

  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
