import React from 'react';

export type ErrorStateProps = {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  className?: string;
};

export const ErrorState: React.FC<ErrorStateProps> = React.memo(
  ({ title = 'Something went wrong', subtitle = 'Network error', onRetry, className }) => {
    return (
      <section
        className={[
          'bg-red-50 border border-red-300 rounded-xl p-5',
          'transition-all duration-200',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <h3 className="text-base font-semibold text-red-800">{title}</h3>
        <p className="mt-1 text-sm text-red-700">{subtitle}</p>
        {onRetry ? (
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-black hover:scale-[1.03] active:scale-[0.98]"
            onClick={onRetry}
          >
            Try Again
          </button>
        ) : null}
      </section>
    );
  }
);

ErrorState.displayName = 'ErrorState';
