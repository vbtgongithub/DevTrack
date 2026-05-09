// ============================================================================
// ErrorBoundary.tsx — Graceful Error Boundary
// ============================================================================
// React class component that catches render errors in its subtree.
// Displays a styled fallback UI with retry action instead of white-screen.
// ============================================================================

import React from 'react';

interface ErrorBoundaryProps {
  /** Optional page name for contextual messaging */
  pageName?: string;
  /** Child components to render */
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // In production, this would send to an error reporting service.
    // console.error is intentional here — it's the standard React error boundary pattern.
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

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-500 text-center max-w-md mb-1">
            {pageName} encountered an unexpected error.
          </p>
          <p className="text-sm text-gray-400 text-center max-w-md mb-6">
            This is usually temporary — try again or reload the page.
          </p>

          {/* Error details (dev only) */}
          {this.state.error && import.meta.env.DEV && (
            <div className="w-full max-w-lg mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl overflow-auto">
              <p className="text-xs font-mono text-red-600 break-all">
                {this.state.error.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleRetry}
              className="
                inline-flex items-center gap-2 px-5 py-2.5
                bg-gray-900 text-white text-sm font-semibold
                rounded-xl shadow-sm
                hover:bg-black transition-all duration-200
                cursor-pointer
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="
                inline-flex items-center gap-2 px-5 py-2.5
                bg-white text-gray-700 text-sm font-medium
                rounded-xl border border-gray-200 shadow-sm
                hover:bg-gray-50 transition-all duration-200
                cursor-pointer
              "
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
