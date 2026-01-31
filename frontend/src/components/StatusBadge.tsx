import { cn } from '@/lib/utils';
import type { TargetStatus, RunResult } from '@/lib/api/types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  MinusCircle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type StatusVariant = TargetStatus | RunResult | 'RUNNING' | 'DISABLED' | 'DUE';

interface StatusBadgeProps {
  status: StatusVariant;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  errorMessage?: string | null;
}

const statusConfig: Record<StatusVariant, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  dotClassName: string;
}> = {
  OK: {
    label: 'OK',
    icon: CheckCircle2,
    className: 'text-success bg-success/10 border-success/20',
    dotClassName: 'bg-success',
  },
  NO_CHANGE: {
    label: 'No Change',
    icon: CheckCircle2,
    className: 'text-success bg-success/10 border-success/20',
    dotClassName: 'bg-success',
  },
  CHANGED: {
    label: 'Changed',
    icon: AlertTriangle,
    className: 'text-warning bg-warning/10 border-warning/20',
    dotClassName: 'bg-warning',
  },
  ERROR: {
    label: 'Error',
    icon: XCircle,
    className: 'text-destructive bg-destructive/10 border-destructive/20',
    dotClassName: 'bg-destructive',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    className: 'text-destructive bg-destructive/10 border-destructive/20',
    dotClassName: 'bg-destructive',
  },
  SKIPPED: {
    label: 'Skipped',
    icon: MinusCircle,
    className: 'text-muted-foreground bg-muted border-border',
    dotClassName: 'bg-muted-foreground',
  },
  NEVER_RUN: {
    label: 'Never Run',
    icon: Clock,
    className: 'text-muted-foreground bg-muted border-border',
    dotClassName: 'bg-muted-foreground',
  },
  RUNNING: {
    label: 'Running',
    icon: Loader2,
    className: 'text-info bg-info/10 border-info/20',
    dotClassName: 'bg-info animate-pulse',
  },
  DISABLED: {
    label: 'Disabled',
    icon: MinusCircle,
    className: 'text-muted-foreground bg-muted border-border',
    dotClassName: 'bg-muted-foreground',
  },
  DUE: {
    label: 'Due Now',
    icon: Clock,
    className: 'text-warning bg-warning/10 border-warning/20',
    dotClassName: 'bg-warning animate-pulse',
  },
};

const sizeClasses = {
  sm: 'text-2xs px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
  lg: 'text-sm px-2.5 py-1.5 gap-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export function StatusBadge({
  status,
  showLabel = true,
  size = 'md',
  className,
  errorMessage,
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.NEVER_RUN;
  const Icon = config.icon;

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium transition-colors',
        sizeClasses[size],
        config.className,
        className
      )}
    >
      <Icon
        className={cn(
          iconSizes[size],
          status === 'RUNNING' && 'animate-spin'
        )}
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  );

  if (errorMessage) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-sm text-xs font-mono break-all"
        >
          {errorMessage}
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

interface StatusDotProps {
  status: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusDot({
  status,
  size = 'md',
  className,
}: StatusDotProps) {
  const config = statusConfig[status] || statusConfig.NEVER_RUN;
  const dotSizes = { sm: 'h-1.5 w-1.5', md: 'h-2 w-2', lg: 'h-2.5 w-2.5' };

  return (
    <span
      className={cn(
        'rounded-full',
        dotSizes[size],
        config.dotClassName,
        className
      )}
    />
  );
}
