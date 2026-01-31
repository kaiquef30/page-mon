import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  isEnabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  isEnabled = true,
  className,
}: PullToRefreshProps) {
  const { isRefreshing, pullProgress, containerRef, indicatorStyle } = usePullToRefresh({
    onRefresh,
    isEnabled,
  });

  return (
    <div
      ref={containerRef}
      className={cn('relative h-full overflow-auto', className)}
    >
      {/* Pull indicator */}
      <div
        style={indicatorStyle}
        className="absolute top-0 left-1/2 -translate-x-1/2 -mt-16 z-50 pointer-events-none"
      >
        <motion.div
          animate={{
            rotate: isRefreshing ? 360 : pullProgress * 360,
          }}
          transition={
            isRefreshing
              ? {
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }
              : {
                  duration: 0,
                }
          }
          className="flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary shadow-lg"
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary" />
          ) : (
            <RefreshCw
              className="h-5 w-5 text-primary"
              style={{
                opacity: pullProgress,
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
