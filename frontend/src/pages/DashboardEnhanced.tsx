import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTargets, useChanges } from '@/lib/api/queries';
import { StatusDot } from '@/components/StatusBadge';
import { RelativeTime } from '@/components/Countdown';
import { DashboardSkeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { ChangesOverTimeChart, StatusDistributionChart, MiniSparkline } from '@/components/Charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Plus,
  FileText,
  Activity,
  Zap,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format, subDays, startOfDay, isAfter, isBefore } from 'date-fns';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardEnhanced() {
  const { data: targets = [], isLoading: targetsLoading, error: targetsError } = useTargets();
  const { data: changes = [], isLoading: changesLoading } = useChanges({ size: 50 });
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30>(7);

  const stats = useMemo(() => {
    const result = { total: 0, enabled: 0, errors: 0, ok: 0, dueNow: 0 };
    const now = new Date();

    for (const t of targets) {
      result.total++;
      if (t.enabled) result.enabled++;
      if (t.lastStatus === 'ERROR') result.errors++;
      if (t.lastStatus === 'OK') result.ok++;
      if (t.enabled && t.nextRun && new Date(t.nextRun) <= now) result.dueNow++;
    }

    return result;
  }, [targets]);

  // Generate mock trend data for sparklines (in a real app, this would be from API)
  const mockSparklineData = useMemo(() => {
    return {
      total: [12, 15, 14, 18, 20, 19, stats.total],
      ok: [8, 10, 9, 12, 15, 14, stats.ok],
      errors: [2, 1, 3, 2, 1, 2, stats.errors],
      dueNow: [3, 4, 2, 4, 4, 3, stats.dueNow],
    };
  }, [stats]);

  // Calculate trend percentages
  const trends = useMemo(() => {
    const getTrend = (data: number[]) => {
      if (data.length < 2) return 0;
      const current = data[data.length - 1];
      const previous = data[data.length - 2];
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      total: getTrend(mockSparklineData.total),
      ok: getTrend(mockSparklineData.ok),
      errors: getTrend(mockSparklineData.errors),
      dueNow: getTrend(mockSparklineData.dueNow),
    };
  }, [mockSparklineData]);

  // Generate changes over time data
  const changesOverTimeData = useMemo(() => {
    const days = selectedPeriod;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(startOfDay(now), i);
      const dayChanges = changes.filter((change) => {
        const changeDate = startOfDay(new Date(change.createdAt));
        return changeDate.getTime() === date.getTime();
      });

      data.push({
        date: format(date, 'MMM dd'),
        changes: dayChanges.length,
      });
    }

    return data;
  }, [changes, selectedPeriod]);

  // Generate status distribution data
  const statusDistributionData = useMemo(() => {
    const colors = {
      OK: '#10b981',
      ERROR: '#ef4444',
      NEVER_RUN: '#6b7280',
      DISABLED: '#9ca3af',
    };

    return [
      { name: 'Healthy', value: stats.ok, color: colors.OK },
      { name: 'Errors', value: stats.errors, color: colors.ERROR },
      { name: 'Disabled', value: targets.filter((t) => !t.enabled).length, color: colors.DISABLED },
      {
        name: 'Never Run',
        value: targets.filter((t) => t.lastStatus === 'NEVER_RUN').length,
        color: colors.NEVER_RUN,
      },
    ].filter((item) => item.value > 0);
  }, [stats, targets]);

  const operationalIssues = useMemo(() => {
    return targets
      .filter((t) => t.enabled && (t.lastStatus === 'ERROR' || !t.nextRun || new Date(t.nextRun!) <= new Date()))
      .sort((a, b) => {
        if (a.lastStatus === 'ERROR' && b.lastStatus !== 'ERROR') return -1;
        if (b.lastStatus === 'ERROR' && a.lastStatus !== 'ERROR') return 1;
        return 0;
      })
      .slice(0, 5);
  }, [targets]);

  // Get recent high-activity targets
  const highActivityTargets = useMemo(() => {
    const targetChangeCounts = new Map<string, number>();
    const recentChanges = changes.filter((c) => {
      const changeDate = new Date(c.createdAt);
      const weekAgo = subDays(new Date(), 7);
      return isAfter(changeDate, weekAgo);
    });

    recentChanges.forEach((change) => {
      const count = targetChangeCounts.get(change.targetId) || 0;
      targetChangeCounts.set(change.targetId, count + 1);
    });

    return Array.from(targetChangeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([targetId, count]) => ({
        target: targets.find((t) => t.id === targetId),
        count,
      }))
      .filter((item) => item.target);
  }, [targets, changes]);

  if (targetsLoading) {
    return <DashboardSkeleton />;
  }

  if (targetsError) {
    return (
      <ErrorState
        message={targetsError instanceof Error ? targetsError.message : 'Failed to load data'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Monitor your page change detection at a glance</p>
        </div>
        <Link to="/targets/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Target
          </Button>
        </Link>
      </div>

      {/* Enhanced KPI Cards with Sparklines */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnhancedKpiCard
          title="Total Targets"
          value={stats.total}
          icon={Target}
          trend={stats.enabled > 0 ? `${stats.enabled} enabled` : undefined}
          trendPercent={trends.total}
          sparklineData={mockSparklineData.total}
          sparklineColor="#3b82f6"
        />
        <EnhancedKpiCard
          title="Healthy"
          value={stats.ok}
          icon={CheckCircle2}
          iconClassName="text-success"
          valueClassName="text-success"
          trendPercent={trends.ok}
          sparklineData={mockSparklineData.ok}
          sparklineColor="#10b981"
        />
        <EnhancedKpiCard
          title="Errors"
          value={stats.errors}
          icon={AlertCircle}
          iconClassName={stats.errors > 0 ? 'text-destructive' : 'text-muted-foreground'}
          valueClassName={stats.errors > 0 ? 'text-destructive' : undefined}
          trendPercent={trends.errors}
          sparklineData={mockSparklineData.errors}
          sparklineColor="#ef4444"
        />
        <EnhancedKpiCard
          title="Due Now"
          value={stats.dueNow}
          icon={Clock}
          iconClassName={stats.dueNow > 0 ? 'text-warning' : 'text-muted-foreground'}
          valueClassName={stats.dueNow > 0 ? 'text-warning' : undefined}
          trendPercent={trends.dueNow}
          sparklineData={mockSparklineData.dueNow}
          sparklineColor="#f59e0b"
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Time Period</h3>
            <div className="flex gap-1">
              <Button
                variant={selectedPeriod === 7 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(7)}
                className="h-7 text-xs"
              >
                7 days
              </Button>
              <Button
                variant={selectedPeriod === 30 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(30)}
                className="h-7 text-xs"
              >
                30 days
              </Button>
            </div>
          </div>
          <ChangesOverTimeChart data={changesOverTimeData} />
        </div>
        <StatusDistributionChart data={statusDistributionData} />
      </motion.div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Inbox */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Needs Attention</CardTitle>
                {operationalIssues.length > 0 && (
                  <Badge variant="destructive" className="h-5 px-2">
                    {operationalIssues.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {operationalIssues.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-success mb-3" />
                  <p className="text-sm font-medium text-foreground">All systems operational</p>
                  <p className="text-xs text-muted-foreground">No issues require attention</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {operationalIssues.map((target) => (
                    <Link
                      key={target.id}
                      to={`/targets/${target.id}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors group"
                    >
                      <StatusDot status={target.lastStatus ?? 'NEVER_RUN'} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{target.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{target.lastError ?? target.url}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Changes */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Changes</CardTitle>
                <Link to="/targets" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {changesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`change-skeleton-${i}`} className="h-14 rounded-md bg-muted shimmer" />
                  ))}
                </div>
              ) : changes.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">No changes yet</p>
                  <p className="text-xs text-muted-foreground">Changes will appear here when detected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {changes.slice(0, 5).map((change) => (
                    <Link
                      key={change.id}
                      to={`/changes/${change.id}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-md bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="h-4 w-4 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {change.targetName ?? `Target #${change.targetId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-success">+{change.linesAdded}</span>
                          {' / '}
                          <span className="text-destructive">-{change.linesRemoved}</span>
                          {' • '}
                          <RelativeTime date={change.createdAt} />
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* High Activity Targets */}
      {highActivityTargets.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-warning" />
                High Activity (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {highActivityTargets.map(({ target, count }) =>
                  target ? (
                    <Link
                      key={target.id}
                      to={`/targets/${target.id}`}
                      className="flex flex-col p-3 rounded-lg border border-border hover:border-warning/50 hover:bg-warning/5 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <StatusDot status={target.lastStatus ?? 'NEVER_RUN'} size="md" />
                        <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                          {count} changes
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1 truncate">{target.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{target.url}</p>
                    </Link>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty state for no targets */}
      {targets.length === 0 && (
        <motion.div variants={item}>
          <EmptyState
            icon={<Target className="h-6 w-6 text-muted-foreground" />}
            title="No targets configured"
            description="Create your first target to start monitoring web pages for changes."
            action={{
              label: 'Create Target',
              onClick: () => (window.location.href = '/targets/new'),
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

interface EnhancedKpiCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendPercent?: number;
  iconClassName?: string;
  valueClassName?: string;
  sparklineData?: number[];
  sparklineColor?: string;
}

function EnhancedKpiCard({
  title,
  value,
  icon: Icon,
  trend,
  trendPercent,
  iconClassName,
  valueClassName,
  sparklineData,
  sparklineColor,
}: EnhancedKpiCardProps) {
  const showTrendIndicator = trendPercent !== undefined && trendPercent !== 0;
  const trendUp = trendPercent && trendPercent > 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4 pb-2">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={cn('text-2xl font-bold', valueClassName)}>{value}</p>
              {showTrendIndicator && (
                <span
                  className={cn(
                    'text-xs font-medium flex items-center gap-0.5',
                    trendUp ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(trendPercent).toFixed(1)}%
                </span>
              )}
            </div>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
          </div>
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Icon className={cn('h-5 w-5', iconClassName || 'text-muted-foreground')} />
          </div>
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-2 -mb-2">
            <MiniSparkline data={sparklineData} color={sparklineColor} height={24} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
