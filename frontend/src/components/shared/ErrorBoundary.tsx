// ============================================================================
// ErrorBoundary.tsx — Production-Grade Error Boundary
// ============================================================================
// Catches render errors in its subtree. Displays a styled fallback with:
// - Contextual error type classification
// - Retry action that resets boundary state
// - Reload action for hard failures
// - Dev-mode error details
// - Auto-recovery hint when possible
// ============================================================================

import React from 'react';
import { Icon } from './Icon';

interface ErrorBoundaryProps {
  pageName?: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

type ErrorType = 'network' | 'validation' | 'render' | 'unknown';

function classifyError(error: Error | null): ErrorType {
  if (!error) return 'unknown';
  const msg = error.message.toLowerCase();

  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('abort')
  ) {
    return 'network';
  }
  if (
    msg.includes('validation') ||
    msg.includes('zod') ||
    msg.includes('parse') ||
    msg.includes('invalid')
  ) {
    return 'validation';
  }
  return 'render';
}

const ERROR_MESSAGES: Record<ErrorType, { title: string; description: string; hint: string }> = {
  network: {
    title: 'Connection Failed',
    description: "DevTrack couldn't reach the server. Check your connection or the server may be temporarily unavailable.",
    hint: 'Try again — the server might just need a moment.',
  },
  validation: {
    title: 'Data Error',
    description: 'Some data from the server was unexpected and caused an error.',
    hint: 'Try reloading the page to fetch fresh data.',
  },
  render: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred while loading this page.',
    hint: 'This is usually temporary. Try again or reload.',
  },
  unknown: {
    title: 'Unexpected Error',
    description: 'An error we did not expect happened.',
    hint: 'Try reloading the page.',
  },
};

const ERROR_EMOJIS: Record<ErrorType, string> = {
  network: '📡',
  validation: '⚙️',
  render: '⚠️',
  unknown: '⚠️',
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Intentional: standard React error boundary pattern for production logging
    console.error(`[ErrorBoundary${this.props.pageName ? `: ${this.props.pageName}` : ''}]`, error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const pageName = this.props.pageName || 'This page';
      const errorType = classifyError(this.state.error);
      const msg = ERROR_MESSAGES[errorType];
      const emoji = ERROR_EMOJIS[errorType];

      return (
        <div className="flex flex-col items-center justify-center min-h-[320px] px-6 py-10 rounded-3xl bg-white/70 backdrop-blur-2xl border border-dt-primary/8 shadow-[0_8px_40px_rgba(124,92,252,0.06)] dt-fade-in">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-dt-primary/5 flex items-center justify-center mb-5 border border-dt-primary/10 shadow-inner">
            <span className="text-2xl">{emoji}</span>
          </div>

          {/* Title */}
          <h2 className="text-[18px] font-black text-dt-text tracking-tight text-center mb-1">
            {msg.title}
          </h2>

          {/* Description */}
          <p className="text-[13px] font-medium text-dt-textSecondary/80 text-center max-w-sm leading-relaxed mt-1">
            {pageName}: {msg.description}
          </p>

          {/* Hint */}
          <p className="text-[12px] text-dt-textMuted text-center max-w-sm mt-2 font-medium">
            {msg.hint}
          </p>

          {/* Dev error details */}
          {this.state.error && import.meta.env.DEV && (
            <div className="w-full max-w-lg mt-4 p-3 bg-red-50/50 border border-red-200/30 rounded-xl overflow-auto">
              <p className="text-[11px] font-mono text-red-500/80 break-all leading-relaxed">
                {this.state.error.name}: {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <p className="text-[10px] font-mono text-red-400/60 mt-2 break-all whitespace-pre-wrap">
                  {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-dt-text text-white text-[13px] font-bold rounded-xl shadow-dt-card hover:shadow-dt-card-hover transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Icon name="arrow-path" size={14} />
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-dt-text text-[13px] font-semibold rounded-xl border border-dt-primary/10 shadow-sm hover:border-dt-primary/20 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Icon name="arrow-up-right" size={14} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
