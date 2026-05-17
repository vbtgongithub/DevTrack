import { cn } from '../../lib/design-system/tokens.css';
import { skeletonPulse } from '../../lib/motion';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      aria-hidden 
      {...skeletonPulse}
      className={cn('rounded-lg bg-zinc-200/60', className)} 
    />
  );
}

function Block({ className }: SkeletonProps) {
  return (
    <div 
      aria-hidden 
      {...skeletonPulse}
      className={cn('rounded-md bg-zinc-100', className)} 
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-3">
      <Block className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Block key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}
