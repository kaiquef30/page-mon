import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTargets, useChanges } from '@/lib/api/queries';
import { StatusDot } from '@/components/StatusBadge';
import { RelativeTime } from '@/components/Countdown';
import { DashboardSkeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Plus,
  FileText,
} from 'lucide-react';

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

export default function Dashboard() {
  const { data: targets = [], isLoading: targetsLoading, error: targetsError } = useTargets();
  const { data: changes = [], isLoading: changesLoading } = useChanges({ size: 10 });

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Monitor your page change detection at a glance
          </p>
        </div>
        <Link to="/targets/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Target
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KpiCard
          title="Total Targets"
          value={stats.total}
          icon={Target}
          trend={stats.enabled > 0 ? `${stats.enabled} enabled` : undefined}
        />
        <KpiCard
          title="Healthy"
          value={stats.ok}
          icon={CheckCircle2}
          iconClassName="text-success"
          valueClassName="text-success"
        />
        <KpiCard
          title="Errors"
          value={stats.errors}
          icon={AlertCircle}
          iconClassName={stats.errors > 0 ? 'text-destructive' : 'text-muted-foreground'}
          valueClassName={stats.errors > 0 ? 'text-destructive' : undefined}
        />
        <KpiCard
          title="Due Now"
          value={stats.dueNow}
          icon={Clock}
          iconClassName={stats.dueNow > 0 ? 'text-warning' : 'text-muted-foreground'}
          valueClassName={stats.dueNow > 0 ? 'text-warning' : undefined}
        />
      </motion.div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Inbox */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Needs Attention
                </CardTitle>
                {operationalIssues.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {operationalIssues.length} issue{operationalIssues.length !== 1 && 's'}
                  </span>
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
                        <p className="text-xs text-muted-foreground truncate">
                          {target.lastError ?? target.url}
                        </p>
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
                <CardTitle className="text-base font-semibold">
                  Recent Changes
                </CardTitle>
                <Link
                  to="/targets"
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {changesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, _i) => (
                    <div key={_i} className="h-14 rounded-md bg-muted shimmer" />
                  ))}
                </div>
              ) : changes.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">No changes yet</p>
                  <p className="text-xs text-muted-foreground">
                    Changes will appear here when detected
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {changes.slice(0, 5).map((change) => (
                    <Link
                      key={change.id}
                      to={`/changes/${change.id}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
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

      {/* Empty state for no targets */}
      {targets.length === 0 && (
        <motion.div variants={item}>
          <EmptyState
            icon={<Target className="h-6 w-6 text-muted-foreground" />}
            title="No targets configured"
            description="Create your first target to start monitoring web pages for changes."
            action={{
              label: 'Create Target',
              onClick: () => window.location.href = '/targets/new',
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  iconClassName?: string;
  valueClassName?: string;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  iconClassName,
  valueClassName,
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className={cn('text-2xl font-bold mt-1', valueClassName)}>
              {value}
            </p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Icon className={cn('h-5 w-5', iconClassName || 'text-muted-foreground')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
