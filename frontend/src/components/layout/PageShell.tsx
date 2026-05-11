// ============================================================================
// PageShell.tsx — Page Content Wrapper
// ============================================================================
// Wraps page content with loading/error/empty state handling.
// ============================================================================

import React from 'react';
import type { PageShellProps } from '../../types/ui.types';

export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  children,
  actions,
  status,
  error,
  onRetry,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 mb-2">
          <h2 className="text-3xl font-black tracking-tighter text-dt-text leading-tight">{title}</h2>
          {subtitle ? <p className="text-[15px] font-bold text-dt-textSecondary/70 tracking-tight">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0 flex items-center gap-2">{actions}</div> : null}
      </div>

      {status === 'error' && error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-lg">⚠️</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-red-700">Something went wrong</div>
              <div className="mt-1 text-sm text-red-600">{error}</div>
              {onRetry ? (
                <button
                  type="button"
                  className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  onClick={onRetry}
                >
                  Try Again
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">{children}</div>
      )}
    </div>
  );
};
