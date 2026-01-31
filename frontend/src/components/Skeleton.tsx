import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted shimmer',
        className
      )}
    />
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
      {Array.from({ length: columns }).map((_, _i) => (
        <Skeleton
          key={_i}
          className={cn(
            'h-4',
            _i === 0 ? 'w-48' : _i === 1 ? 'w-64' : 'w-20'
          )}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, _i) => (
          <CardSkeleton key={_i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, _i) => (
            <div key={_i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export function TargetDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, _i) => (
              <TableRowSkeleton key={_i} columns={4} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
