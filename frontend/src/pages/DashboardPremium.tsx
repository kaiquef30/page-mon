import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTargets, useChanges } from '@/lib/api/queries';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusDot } from '@/components/StatusBadge';
import { RelativeTime } from '@/components/Countdown';
import { DashboardSkeleton } from '@/components/Skeleton';
import { ErrorState, EmptyState } from '@/components/EmptyState';
import { NoTargetsIllustration, NoChangesIllustration } from '@/components/EmptyStateIllustrations';
import { PullToRefresh } from '@/components/PullToRefresh';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  Plus,
  ArrowRight,
  Zap,
  Eye,
  FileText,
} from 'lucide-react';
import { staggerContainer, staggerItem, cardHover } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay } from 'date-fns';

export default function DashboardPremium() {
  const { data: targets = [], isLoading: targetsLoading, error: targetsError, refetch } = useTargets();
  const { data: changes = [], isLoading: changesLoading } = useChanges();

  const stats = useMemo(() => {
    const totalTargets = targets.length;
    const enabledTargets = targets.filter(t => t.enabled).length;
    const healthyTargets = targets.filter(t => t.lastStatus === 'OK' && t.enabled).length;
    const errorTargets = targets.filter(t => t.lastStatus === 'ERROR' && t.enabled).length;
    const neverRun = targets.filter(t => t.lastStatus === 'NEVER_RUN').length;

    const now = new Date();
    const dueTargets = targets.filter(t => {
      if (!t.enabled || !t.nextRun) return false;
      return new Date(t.nextRun) <= now;
    }).length;

    const recentChanges = changes.filter(c => {
      const changeDate = new Date(c.createdAt);
      return changeDate >= subDays(now, 7);
    }).length;

    return {
      totalTargets,
      enabledTargets,
      healthyTargets,
      errorTargets,
      neverRun,
      dueTargets,
      recentChanges,
      healthPercentage: totalTargets > 0 ? Math.round((healthyTargets / enabledTargets) * 100) || 0 : 0,
    };
  }, [targets, changes]);

  const chartData = useMemo(() => {
    const days = 7;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = format(date, 'MMM dd');

      const dayChanges = changes.filter(c => {
        const changeDate = startOfDay(new Date(c.createdAt));
        return changeDate.getTime() === date.getTime();
      });

      data.push({
        date: dateStr,
        changes: dayChanges.length,
        linesAdded: dayChanges.reduce((sum, c) => sum + c.linesAdded, 0),
        linesRemoved: dayChanges.reduce((sum, c) => sum + c.linesRemoved, 0),
      });
    }

    return data;
  }, [changes]);

  if (targetsError) {
    return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;
  }

  if (targetsLoading) {
    return <DashboardSkeleton />;
  }

  if (targets.length === 0) {
    return (
      <EmptyState
        illustration={<NoTargetsIllustration />}
        title="No targets yet"
        description="Create your first target to start monitoring web pages for changes"
        action={{
          label: 'Create Your First Target',
          onClick: () => window.location.href = '/targets/new',
        }}
      />
    );
  }

  return (
    <PullToRefresh onRefresh={() => refetch()} isEnabled={!targetsLoading}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your monitoring activity
          </p>
        </div>
        <Link to="/targets/new">
          <Button className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="h-4 w-4" />
            New Target
          </Button>
        </Link>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={staggerItem}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Targets</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <AnimatedNumber
                value={stats.totalTargets}
                className="text-3xl font-bold"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.enabledTargets} active
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Healthy</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <AnimatedNumber
                  value={stats.healthyTargets}
                  className="text-3xl font-bold text-green-500"
                />
                <span className="text-sm text-muted-foreground">
                  / {stats.enabledTargets}
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.healthPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <AnimatedNumber
                value={stats.errorTargets}
                className={cn(
                  "text-3xl font-bold",
                  stats.errorTargets > 0 ? "text-red-500" : "text-muted-foreground"
                )}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.errorTargets > 0 ? 'Need attention' : 'All good!'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Changes (7d)</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <AnimatedNumber
                value={stats.recentChanges}
                className="text-3xl font-bold text-purple-500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Last week
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        className="grid gap-4 md:grid-cols-2"
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Changes Timeline
              </CardTitle>
              <CardDescription>Number of changes detected per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="changesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="changes"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#changesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Lines Changed
              </CardTitle>
              <CardDescription>Added vs Removed lines</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="linesAdded" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="linesRemoved" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        className="grid gap-4 md:grid-cols-2"
      >
        {(stats.errorTargets > 0 || stats.dueTargets > 0) && (
          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {targets
                    .filter(t => (t.lastStatus === 'ERROR' && t.enabled) || (t.enabled && t.nextRun && new Date(t.nextRun) <= new Date()))
                    .slice(0, 5)
                    .map((target) => (
                      <Link key={target.id} to={`/targets/${target.id}`}>
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:border-warning/50 hover:bg-warning/5 transition-colors cursor-pointer"
                        >
                          <StatusDot status={target.lastStatus || 'NEVER_RUN'} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{target.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {target.url}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Recent Changes
              </CardTitle>
              <Link to="/targets">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {changesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : changes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Eye className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No changes detected yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {changes.slice(0, 5).map((change) => {
                    const target = targets.find(t => t.id === change.targetId);
                    return (
                      <Link key={change.id} to={`/changes/${change.id}`}>
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {target?.name || 'Unknown Target'}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                                +{change.linesAdded}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                                -{change.linesRemoved}
                              </Badge>
                              <RelativeTime
                                date={change.createdAt}
                                className="text-xs text-muted-foreground"
                              />
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
    </PullToRefresh>
  );
}
