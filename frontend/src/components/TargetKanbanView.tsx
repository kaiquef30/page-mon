import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Target, TargetStatus } from '@/lib/api/types';
import { StatusDot } from './StatusBadge';
import { Countdown, RelativeTime } from './Countdown';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
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
  Clock,
} from 'lucide-react';
import { useMemo } from 'react';

interface TargetKanbanViewProps {
  targets: Target[];
  onRun: (target: Target) => void;
  onToggleEnabled: (target: Target) => void;
  onDelete: (target: Target) => void;
  onCopyUrl: (url: string) => void;
}

type KanbanColumn = {
  id: string;
  title: string;
  status: TargetStatus | 'DISABLED' | 'DUE';
  color: string;
  bgColor: string;
};

const columns: KanbanColumn[] = [
  {
    id: 'ok',
    title: 'Healthy',
    status: 'OK',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 'due',
    title: 'Due Now',
    status: 'DUE',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 'error',
    title: 'Errors',
    status: 'ERROR',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    id: 'never_run',
    title: 'Never Run',
    status: 'NEVER_RUN',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
  },
  {
    id: 'disabled',
    title: 'Disabled',
    status: 'DISABLED',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
  },
];

export function TargetKanbanView({
  targets,
  onRun,
  onToggleEnabled,
  onDelete,
  onCopyUrl,
}: TargetKanbanViewProps) {
  const targetsByColumn = useMemo(() => {
    const grouped = new Map<string, Target[]>();

    columns.forEach((col) => {
      grouped.set(col.id, []);
    });

    targets.forEach((target) => {
      if (!target.enabled) {
        grouped.get('disabled')?.push(target);
      } else if (target.lastStatus === 'ERROR') {
        grouped.get('error')?.push(target);
      } else if (target.enabled && target.nextRun && new Date(target.nextRun) <= new Date()) {
        grouped.get('due')?.push(target);
      } else if (target.lastStatus === 'OK') {
        grouped.get('ok')?.push(target);
      } else if (target.lastStatus === 'NEVER_RUN' || !target.lastStatus) {
        grouped.get('never_run')?.push(target);
      }
    });

    return grouped;
  }, [targets]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTargets = targetsByColumn.get(column.id) || [];

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
          >
            <Card className={`${column.bgColor} border-2`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-base font-semibold ${column.color}`}>
                    {column.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {columnTargets.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    {columnTargets.map((target) => (
                      <Card
                        key={target.id}
                        className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <StatusDot
                              status={target.enabled ? (target.lastStatus ?? 'NEVER_RUN') : 'DISABLED'}
                              size="md"
                            />

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
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
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => onDelete(target)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <Link to={`/targets/${target.id}`}>
                            <h4 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors">
                              {target.name}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate mb-2">
                              {new URL(target.url).hostname}
                            </p>
                          </Link>

                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {target.mode}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {target.intervalMinutes}m
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {target.enabled ? (
                              <div className="flex items-center justify-between">
                                <span>Next:</span>
                                <Countdown targetDate={target.nextRun} />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span>Last:</span>
                                <RelativeTime date={target.lastRun} />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </motion.div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
