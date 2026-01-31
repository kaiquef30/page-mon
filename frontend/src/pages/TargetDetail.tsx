import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  useTarget,
  useTargetChanges,
  useTargetSnapshots,
  useRunTarget,
  useUpdateTarget,
  useDeleteTarget,
} from '@/lib/api/queries';
import { StatusBadge } from '@/components/StatusBadge';
import { Countdown, RelativeTime } from '@/components/Countdown';
import { TargetDetailSkeleton } from '@/components/Skeleton';
import { ErrorState, EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Play,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  History,
  Settings2,
  Loader2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TargetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [forceRun, setForceRun] = useState(false);
  const [activeTab, setActiveTab] = useState('changes');

  const targetId = id || '';

  const { data: target, isLoading, error, refetch } = useTarget(targetId);
  const { data: changes = [] } = useTargetChanges(targetId, { enabled: activeTab === 'changes' });
  const { data: snapshots = [] } = useTargetSnapshots(targetId, { enabled: activeTab === 'snapshots' });

  const runMutation = useRunTarget();
  const updateMutation = useUpdateTarget();
  const deleteMutation = useDeleteTarget();

  const handleRun = async () => {
    if (!target) return;
    try {
      const result = await runMutation.mutateAsync({ id: target.id, force: forceRun });
      if (result.result === 'CHANGED') {
        toast.success('Changes detected!', {
          action: result.changeId
            ? {
                label: 'View',
                onClick: () => navigate(`/changes/${result.changeId}`),
              }
            : undefined,
        });
      } else if (result.result === 'NO_CHANGE') {
        toast.success('No changes detected');
      } else if (result.result === 'SKIPPED') {
        toast.info('Run skipped');
      } else {
        toast.error(`Run failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error('Failed to run target');
    }
  };

  const handleToggleEnabled = async () => {
    if (!target) return;
    try {
      await updateMutation.mutateAsync({
        id: target.id,
        data: { enabled: !target.enabled },
      });
      toast.success(target.enabled ? 'Target disabled' : 'Target enabled');
    } catch (err) {
      toast.error('Failed to update target');
    }
  };

  const handleDelete = async () => {
    if (!target) return;
    try {
      await deleteMutation.mutateAsync(target.id);
      toast.success('Target deleted');
      navigate('/targets');
    } catch (err) {
      toast.error('Failed to delete target');
    }
  };

  if (isLoading) {
    return <TargetDetailSkeleton />;
  }

  if (error || !target) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Target not found'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/targets')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground">Targets</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{target.name}</h1>
              <StatusBadge
                status={target.enabled ? (target.lastStatus ?? 'NEVER_RUN') : 'DISABLED'}
                errorMessage={target.lastError}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <a
                href={target.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1"
              >
                {target.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 mr-2">
              <Switch
                checked={forceRun}
                onCheckedChange={setForceRun}
                id="force-run"
              />
              <label htmlFor="force-run" className="text-sm text-muted-foreground">
                Force
              </label>
            </div>
            <Button
              onClick={handleRun}
              disabled={runMutation.isPending}
              className="gap-2"
            >
              {runMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Now
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/targets/${target.id}/edit`)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="changes" className="space-y-4" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="changes" className="gap-2">
                <History className="h-4 w-4" />
                Changes ({changes.length})
              </TabsTrigger>
              <TabsTrigger value="snapshots" className="gap-2">
                <FileText className="h-4 w-4" />
                Snapshots ({snapshots.length})
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="changes" className="space-y-4">
              {changes.length === 0 ? (
                <EmptyState
                  icon={<History className="h-6 w-6 text-muted-foreground" />}
                  title="No changes detected yet"
                  description="Changes will appear here when the monitored page content changes."
                />
              ) : (
                <div className="space-y-3">
                  {changes.map((change) => (
                    <Link
                      key={change.id}
                      to={`/changes/${change.id}`}
                      className="block"
                    >
                      <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                                <Zap className="h-4 w-4 text-warning" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  <span className="text-success">+{change.linesAdded}</span>
                                  {' / '}
                                  <span className="text-destructive">-{change.linesRemoved}</span>
                                  {' lines'}
                                </p>
                                <RelativeTime
                                  date={change.createdAt}
                                  className="text-xs"
                                />
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              View Diff
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="snapshots" className="space-y-4">
              {snapshots.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                  title="No snapshots yet"
                  description="Snapshots are created after each successful run."
                />
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snapshot) => (
                    <Card key={snapshot.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm font-mono">
                              {snapshot.hash.slice(0, 8)}
                            </p>
                            <RelativeTime
                              date={snapshot.fetchedAt}
                              className="text-xs"
                            />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {snapshot.httpStatus ? `HTTP ${snapshot.httpStatus}` : 'HTTP —'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mode</p>
                      <p className="font-medium">{target.mode}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interval</p>
                      <p className="font-medium">{target.intervalMinutes} minutes</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CSS Selector</p>
                      <p className="font-medium font-mono text-xs">
                        {target.cssSelector || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ignore Patterns</p>
                      <p className="font-medium font-mono text-xs">
                        {target.ignoreRegexes?.length ?? 0} patterns
                      </p>
                    </div>
                  </div>

                  {target.ignoreRegexes && target.ignoreRegexes.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">
                        Ignore Patterns
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {target.ignoreRegexes.map((regex, _i) => (
                          <Badge key={_i} variant="outline" className="font-mono text-xs">
                            {regex}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Status panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Enabled</span>
                <Switch
                  checked={target.enabled}
                  onCheckedChange={handleToggleEnabled}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Run:</span>
                  <RelativeTime date={target.lastRun} />
                </div>

                {target.enabled && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Next Run:</span>
                    <Countdown targetDate={target.nextRun} />
                  </div>
                )}

                {target.lastStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    {target.lastStatus === 'OK' ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-muted-foreground">Status:</span>
                    <StatusBadge
                      status={target.lastStatus}
                      size="sm"
                      errorMessage={target.lastError}
                    />
                  </div>
                )}
              </div>

              {target.lastError && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Last Error</p>
                  <p className="text-xs font-mono text-destructive bg-destructive/10 p-2 rounded">
                    {target.lastError}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(target.url);
                  toast.success('URL copied');
                }}
              >
                <Copy className="h-4 w-4" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => window.open(target.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Open in Browser
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Target</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{target.name}"? This will permanently remove all snapshots and change history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
