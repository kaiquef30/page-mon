import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChange, useTarget } from '@/lib/api/queries';
import { DiffViewerEnhanced as DiffViewer } from '@/components/DiffViewerEnhanced';
import { ErrorState } from '@/components/EmptyState';
import { RelativeTime } from '@/components/Countdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/Skeleton';
import {
  ArrowLeft,
  ExternalLink,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export default function ChangeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const changeId = id || '';

  const { data: change, isLoading, error, refetch } = useChange(changeId);
  const { data: target } = useTarget(change?.targetId || '');

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error || !change) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Change not found'}
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
            onClick={() => navigate(-1)}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground">Change Details</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              Change {change.id.slice(0, 8)}
            </h1>
            {target && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <Link
                  to={`/targets/${target.id}`}
                  className="hover:text-foreground"
                >
                  {target.name}
                </Link>
                <span>•</span>
                <a
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground flex items-center gap-1"
                >
                  {(() => {
                    try {
                      return new URL(target.url).hostname;
                    } catch {
                      return target.url;
                    }
                  })()}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Detected:</span>
              <RelativeTime date={change.createdAt} className="text-sm font-medium" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  +{change.linesAdded} lines
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  -{change.linesRemoved} lines
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diff Viewer */}
      <DiffViewer diff={change.diff} maxHeight="calc(100vh - 350px)" />

      {/* Actions */}
      {target && (
        <div className="flex items-center gap-3">
          <Link to={`/targets/${target.id}`}>
            <Button variant="outline" className="gap-2">
              <Target className="h-4 w-4" />
              View Target
            </Button>
          </Link>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(target.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Open Page
          </Button>
        </div>
      )}
    </motion.div>
  );
}
