import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  pullDownThreshold?: number;
  maxPullDown?: number;
  refreshingContent?: React.ReactNode;
  pullingContent?: React.ReactNode;
  isEnabled?: boolean;
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullProgress: number;
  containerRef: React.RefObject<HTMLDivElement>;
  indicatorStyle: React.CSSProperties;
}

export function usePullToRefresh({
  onRefresh,
  pullDownThreshold = 80,
  maxPullDown = 120,
  isEnabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isEnabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only start if at top of scroll
    if (container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isEnabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || !isEnabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    // Only pull down
    if (distance > 0 && container.scrollTop === 0) {
      // Prevent default to stop scroll bounce
      e.preventDefault();

      // Apply resistance for smoother feel
      const resistanceFactor = Math.min(distance / maxPullDown, 1);
      const adjustedDistance = distance * (1 - resistanceFactor * 0.5);

      setPullDistance(Math.min(adjustedDistance, maxPullDown));
    }
  }, [isEnabled, isRefreshing, maxPullDown]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || !isEnabled) return;

    isPulling.current = false;

    if (pullDistance >= pullDownThreshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to 0
      setPullDistance(0);
    }
  }, [isEnabled, pullDistance, pullDownThreshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isEnabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isEnabled]);

  const pullProgress = Math.min(pullDistance / pullDownThreshold, 1);

  const indicatorStyle: React.CSSProperties = {
    transform: `translateY(${isRefreshing ? pullDownThreshold : pullDistance}px)`,
    transition: isPulling.current ? 'none' : 'transform 0.3s ease-out',
    opacity: pullProgress,
  };

  return {
    isRefreshing,
    pullProgress,
    containerRef,
    indicatorStyle,
  };
}
