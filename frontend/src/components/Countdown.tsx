import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isPast, differenceInSeconds } from 'date-fns';
import { useTime } from '@/contexts/TimeContext';

interface CountdownProps {
  targetDate: string | Date | null | undefined;
  className?: string;
  showOverdue?: boolean;
  onDue?: () => void;
}

export function Countdown({
  targetDate,
  className,
  showOverdue = true,
  onDue,
}: CountdownProps) {
  const { currentTime, tick } = useTime();

  const { date, isOverdue, secondsUntil, distance } = useMemo(() => {
    if (!targetDate) {
      return { date: null as Date | null, isOverdue: false, secondsUntil: Infinity, distance: '' };
    }
    const d = new Date(targetDate);
    return {
      date: d,
      isOverdue: isPast(d),
      secondsUntil: differenceInSeconds(d, currentTime),
      distance: formatDistanceToNow(d, { addSuffix: false }),
    };
  }, [targetDate, currentTime, tick]);

  useEffect(() => {
    if (secondsUntil <= 0 && onDue) {
      onDue();
    }
  }, [secondsUntil, onDue]);

  if (!date) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  if (isOverdue && showOverdue) {
    return (
      <span className={cn('text-warning font-medium', className)}>
        Due now
      </span>
    );
  }

  const urgencyClass =
    secondsUntil < 60
      ? 'text-warning'
      : secondsUntil < 300
      ? 'text-warning/80'
      : 'text-muted-foreground';

  return (
    <span className={cn('tabular-nums', urgencyClass, className)}>
      {distance}
    </span>
  );
}

interface RelativeTimeProps {
  date: string | Date | null | undefined;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const { tick } = useTime();

  const minuteTick = useMemo(() => Math.floor(tick / 60), [tick]);

  const formattedDate = useMemo(() => {
    if (!date) return null;
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }, [date, minuteTick]);

  if (!formattedDate) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  return (
    <span className={cn('text-muted-foreground', className)}>
      {formattedDate}
    </span>
  );
}
