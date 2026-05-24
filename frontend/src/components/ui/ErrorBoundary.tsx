// src/components/ui/ErrorBoundary.tsx — Graceful failure boundary
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 text-center bg-white/50 backdrop-blur-xl rounded-[32px] border border-rose-100 shadow-xl shadow-rose-500/5">
          <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6 border border-rose-100">
            <AlertTriangle size={40} className="text-rose-500" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-3">
            Something went wrong
          </h2>
          
          <p className="text-slate-500 font-medium max-w-[400px] mb-8 leading-relaxed">
            A critical error occurred in this section of the dashboard. Our engineers have been notified.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <button
              onClick={this.handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-dt-primary text-white font-black text-sm shadow-lg shadow-dt-primary/25 hover:bg-dt-primary-dark transition-all active:scale-[0.98]"
            >
              <RefreshCw size={18} />
              <span>Retry Component</span>
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              <Home size={18} />
              <span>Go to Home</span>
            </button>
          </div>

          {import.meta.env?.DEV && this.state.error && (
            <div className="mt-8 p-4 rounded-xl bg-slate-900 text-rose-300 text-left overflow-auto max-w-full font-mono text-[10px] w-full">
              <p className="font-bold mb-2">Debug Info:</p>
              {this.state.error.stack}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
