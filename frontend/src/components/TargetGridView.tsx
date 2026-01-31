import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Target } from '@/lib/api/types';
import { StatusBadge, StatusDot } from './StatusBadge';
import { Countdown, RelativeTime } from './Countdown';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  MoreHorizontal,
  Play,
  Power,
  PowerOff,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Globe,
  Clock,
  Activity,
} from 'lucide-react';

interface TargetGridViewProps {
  targets: Target[];
  onRun: (target: Target) => void;
  onToggleEnabled: (target: Target) => void;
  onDelete: (target: Target) => void;
  onCopyUrl: (url: string) => void;
  selectedTargets?: Set<string>;
  onToggleSelect?: (targetId: string) => void;
  showCheckboxes?: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
};

export function TargetGridView({
  targets,
  onRun,
  onToggleEnabled,
  onDelete,
  onCopyUrl,
  selectedTargets,
  onToggleSelect,
  showCheckboxes,
}: TargetGridViewProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {targets.map((target) => (
        <motion.div key={target.id} variants={item}>
          <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50 relative overflow-hidden">
            {/* Background gradient based on status */}
            <div
              className={`absolute inset-0 opacity-5 ${
                target.lastStatus === 'ERROR'
                  ? 'bg-gradient-to-br from-destructive to-transparent'
                  : target.lastStatus === 'OK'
                  ? 'bg-gradient-to-br from-success to-transparent'
                  : 'bg-gradient-to-br from-muted to-transparent'
              }`}
            />

            <CardContent className="p-4 relative">
              {/* Header with checkbox and status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {showCheckboxes && onToggleSelect && (
                    <input
                      type="checkbox"
                      checked={selectedTargets?.has(target.id)}
                      onChange={() => onToggleSelect(target.id)}
                      className="h-4 w-4 rounded border-border"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <StatusDot
                    status={target.enabled ? (target.lastStatus ?? 'NEVER_RUN') : 'DISABLED'}
                    size="lg"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onRun(target)}>
                      <Play className="h-4 w-4 mr-2" />
                      Run Now
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleEnabled(target)}>
                      {target.enabled ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Enable
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onCopyUrl(target.url)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(target.url, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open URL
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(target)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Title and URL */}
              <Link to={`/targets/${target.id}`} className="block mb-3">
                <h3 className="font-semibold text-base mb-1 line-clamp-2 hover:text-primary transition-colors">
                  {target.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Globe className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{new URL(target.url).hostname}</span>
                </div>
              </Link>

              {/* Status Badge */}
              <div className="mb-3">
                <StatusBadge
                  status={target.enabled ? (target.lastStatus ?? 'NEVER_RUN') : 'DISABLED'}
                  size="sm"
                  errorMessage={target.lastError}
                />
              </div>

              {/* Mode and Stats */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  {target.mode}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {target.intervalMinutes}m
                </div>
              </div>

              {/* Time info */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Run:</span>
                  <RelativeTime date={target.lastRun} />
                </div>
                {target.enabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Next Run:</span>
                    <Countdown targetDate={target.nextRun} />
                  </div>
                )}
              </div>

              {/* Quick action button */}
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRun(target);
                  }}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Run Check
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
