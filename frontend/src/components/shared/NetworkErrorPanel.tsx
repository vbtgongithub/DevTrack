import React, { useCallback } from 'react';
import { Icon } from './Icon';

const RETRY_INTERVAL_S = 15;

const NETWORK_ERROR_PATTERNS = [
  'network',
  'failed to fetch',
  'etimedout',
  'econnrefused',
  'econnreset',
];

function isNetworkError(msg: string | null): boolean {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}

interface NetworkErrorPanelProps {
  error: string;
  onRetry: () => void;
  variant?: 'card' | 'centered';
}

export const NetworkErrorPanel: React.FC<NetworkErrorPanelProps> = ({ error, onRetry, variant = 'card' }) => {
  const [countdown, setCountdown] = React.useState(RETRY_INTERVAL_S);
  const networkErr = isNetworkError(error);

  const stableRetry = useCallback(() => { onRetry(); }, [onRetry]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          stableRetry();
          return RETRY_INTERVAL_S;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stableRetry]);

  const handleManualRetry = () => {
    setCountdown(RETRY_INTERVAL_S);
    stableRetry();
  };

  const iconBlock = networkErr ? (
    <svg className="w-7 h-7 text-amber-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  ) : (
    <Icon name="exclamation-triangle" size={24} className="text-red-500" />
  );

  if (variant === 'centered') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className={`flex h-16 w-16 items-center justify-center rounded-[20px] ${
          networkErr ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'
        } shadow-sm`}>
          {iconBlock}
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {networkErr ? 'Server is Waking Up' : 'Something Went Wrong'}
          </h3>
          {networkErr ? (
            <>
              <p className="text-sm text-slate-500 mb-1">The backend is starting up — this takes ~30 seconds on first load.</p>
              <p className="text-xs text-slate-400 mb-4">Auto-retrying in <span className="font-bold text-indigo-600 tabular-nums">{countdown}s</span></p>
            </>
          ) : (
            <p className="text-sm text-slate-500 mb-4">{error}</p>
          )}
          <button
            type="button"
            onClick={handleManualRetry}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dt-fade-in">
      <div className="dt-card dt-card-pad-xl text-center max-w-md mx-auto shadow-dt-floating">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] ${
          networkErr ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'
        } shadow-sm`}>
          {iconBlock}
        </div>

        {networkErr ? (
          <>
            <h3 className="text-dashboard-title text-lg mb-1">Server is Waking Up</h3>
            <p className="text-body-sm mb-1 text-dt-textSecondary">
              The backend is starting up — this takes ~30 seconds on first load.
            </p>
            <p className="text-[11px] text-dt-textMuted mb-6">
              Auto-retrying in <span className="font-bold text-dt-primary tabular-nums">{countdown}s</span>
            </p>
          </>
        ) : (
          <>
            <h3 className="text-dashboard-title text-lg mb-2">Something Went Wrong</h3>
            <p className="text-body-sm mb-6 text-dt-textSecondary">{error}</p>
          </>
        )}

        <button
          type="button"
          onClick={handleManualRetry}
          className="dt-btn dt-btn-primary dt-btn-md px-8"
        >
          Retry
        </button>
      </div>
    </div>
  );
};
