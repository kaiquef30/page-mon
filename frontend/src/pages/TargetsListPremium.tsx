import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useTargets, useRunTarget, useUpdateTarget, useDeleteTarget } from '@/lib/api/queries';
import type { Target, TargetStatus, TargetMode } from '@/lib/api/types';
import { StatusBadge, StatusDot } from '@/components/StatusBadge';
import { Countdown, RelativeTime } from '@/components/Countdown';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { NoTargetsIllustration, NoSearchResultsIllustration } from '@/components/EmptyStateIllustrations';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Power,
  PowerOff,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Target as TargetIcon,
  Loader2,
  Download,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '@/lib/animations';

type FilterStatus = 'all' | TargetStatus | 'enabled' | 'disabled';
type FilterMode = 'all' | TargetMode;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function TargetsListPremium() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [modeFilter, setModeFilter] = useState<FilterMode>('all');
  const [deleteTarget, setDeleteTarget] = useState<Target | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [orderedTargets, setOrderedTargets] = useState<Target[]>([]);

  const { data: targets = [], isLoading, error, refetch } = useTargets();
  const runTargetMutation = useRunTarget();
  const updateTargetMutation = useUpdateTarget();
  const deleteTargetMutation = useDeleteTarget();

  const debouncedSearch = useDebounce(search, 300);

  // Initialize and update ordered targets
  useEffect(() => {
    if (targets.length > 0) {
      // Load saved order from localStorage or use default
      const savedOrder = localStorage.getItem('targets-order');
      if (savedOrder) {
        try {
          const orderMap = JSON.parse(savedOrder) as Record<string, number>;
          const sorted = [...targets].sort((a, b) => {
            const orderA = orderMap[a.id] ?? 999999;
            const orderB = orderMap[b.id] ?? 999999;
            return orderA - orderB;
          });
          setOrderedTargets(sorted);
        } catch {
          setOrderedTargets(targets);
        }
      } else {
        setOrderedTargets(targets);
      }
    }
  }, [targets]);

  const filteredTargets = useMemo(() => {
    return orderedTargets.filter((target) => {
      const matchesSearch =
        !debouncedSearch ||
        target.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        target.url.toLowerCase().includes(debouncedSearch.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'enabled') {
        matchesStatus = target.enabled;
      } else if (statusFilter === 'disabled') {
        matchesStatus = !target.enabled;
      } else if (statusFilter !== 'all') {
        matchesStatus = target.lastStatus === statusFilter;
      }

      const matchesMode = modeFilter === 'all' || target.mode === modeFilter;

      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [orderedTargets, debouncedSearch, statusFilter, modeFilter]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredTargets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update ordered targets
    setOrderedTargets(prev => {
      const newOrder = [...prev];
      const startIndex = prev.findIndex(t => t.id === items[0].id);

      // Remove filtered items from their current positions
      const filtered = items.map(item => item.id);
      const remaining = newOrder.filter(t => !filtered.includes(t.id));

      // Insert reordered items at the correct position
      remaining.splice(startIndex, 0, ...items);

      // Save order to localStorage
      const orderMap: Record<string, number> = {};
      remaining.forEach((target, index) => {
        orderMap[target.id] = index;
      });
      localStorage.setItem('targets-order', JSON.stringify(orderMap));

      return remaining;
    });

    toast.success('Target order updated', {
      description: 'Drag and drop to reorder targets',
    });
  }, [filteredTargets]);

  const handleRun = useCallback(async (target: Target) => {
    try {
      const result = await runTargetMutation.mutateAsync({ id: target.id });
      if (result.result === 'CHANGED') {
        toast.success(`Changes detected on ${target.name}`, {
          action: result.changeId
            ? {
                label: 'View',
                onClick: () => navigate(`/changes/${result.changeId}`),
              }
            : undefined,
        });
      } else if (result.result === 'NO_CHANGE') {
        toast.success(`No changes on ${target.name}`);
      } else if (result.result === 'FAILED') {
        toast.error(`Run failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error('Failed to run target');
    }
  }, [runTargetMutation, navigate]);

  const handleToggleEnabled = useCallback(async (target: Target) => {
    try {
      await updateTargetMutation.mutateAsync({
        id: target.id,
        data: { enabled: !target.enabled },
      });
      toast.success(
        target.enabled ? `${target.name} disabled` : `${target.name} enabled`,
        {
          action: {
            label: 'Undo',
            onClick: () =>
              updateTargetMutation.mutate({
                id: target.id,
                data: { enabled: target.enabled },
              }),
          },
        }
      );
    } catch (err) {
      toast.error('Failed to update target');
    }
  }, [updateTargetMutation]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteTargetMutation.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Failed to delete target');
    }
  }, [deleteTarget, deleteTargetMutation]);

  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL to clipboard');
    }
  }, []);

  // Bulk actions
  const handleToggleSelect = useCallback((targetId: string) => {
    setSelectedTargets(prev => {
      const next = new Set(prev);
      if (next.has(targetId)) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedTargets.size === filteredTargets.length) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(filteredTargets.map(t => t.id)));
    }
  }, [selectedTargets.size, filteredTargets]);

  const handleBulkRun = useCallback(async () => {
    const selected = orderedTargets.filter(t => selectedTargets.has(t.id));
    toast.promise(
      Promise.all(selected.map(t => runTargetMutation.mutateAsync({ id: t.id }))),
      {
        loading: `Running ${selected.length} targets...`,
        success: `${selected.length} targets run successfully`,
        error: 'Some targets failed to run',
      }
    );
    setSelectedTargets(new Set());
  }, [selectedTargets, orderedTargets, runTargetMutation]);

  const handleBulkEnable = useCallback(async () => {
    const selected = orderedTargets.filter(t => selectedTargets.has(t.id));
    await Promise.all(
      selected.map(t => updateTargetMutation.mutateAsync({
        id: t.id,
        data: { enabled: true },
      }))
    );
    toast.success(`${selected.length} targets enabled`);
    setSelectedTargets(new Set());
  }, [selectedTargets, orderedTargets, updateTargetMutation]);

  const handleBulkDisable = useCallback(async () => {
    const selected = orderedTargets.filter(t => selectedTargets.has(t.id));
    await Promise.all(
      selected.map(t => updateTargetMutation.mutateAsync({
        id: t.id,
        data: { enabled: false },
      }))
    );
    toast.success(`${selected.length} targets disabled`);
    setSelectedTargets(new Set());
  }, [selectedTargets, orderedTargets, updateTargetMutation]);

  const handleBulkDelete = useCallback(async () => {
    const selected = orderedTargets.filter(t => selectedTargets.has(t.id));
    await Promise.all(
      selected.map(t => deleteTargetMutation.mutateAsync(t.id))
    );
    toast.success(`${selected.length} targets deleted`);
    setSelectedTargets(new Set());
    setShowBulkDelete(false);
  }, [selectedTargets, orderedTargets, deleteTargetMutation]);

  const handleBulkExport = useCallback(() => {
    const selected = orderedTargets.filter(t => selectedTargets.has(t.id));
    const data = JSON.stringify(selected, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `targets-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selected.length} targets exported`);
    setSelectedTargets(new Set());
  }, [selectedTargets, orderedTargets]);

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load targets'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <PullToRefresh onRefresh={() => refetch()} isEnabled={!isLoading}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Targets</h1>
          <p className="text-muted-foreground text-sm">
            Manage your monitored pages
          </p>
        </div>
        <Link to="/targets/new">
          <Button className="gap-2 shadow-md hover:shadow-lg transition-shadow">
            <Plus className="h-4 w-4" />
            Create Target
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search targets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="OK">OK</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="NEVER_RUN">Never Run</SelectItem>
          </SelectContent>
        </Select>
        <Select value={modeFilter} onValueChange={(v) => setModeFilter(v as FilterMode)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="TEXT">Text</SelectItem>
            <SelectItem value="PLAYWRIGHT">Playwright</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div variants={staggerItem} className="border border-border rounded-lg overflow-hidden shadow-sm">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedTargets.size === filteredTargets.length && filteredTargets.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[300px]">Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <Droppable droppableId="targets">
              {(provided, snapshot) => (
                <TableBody
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={snapshot.isDraggingOver ? 'bg-muted/20' : ''}
                >
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, _i) => (
                      <TableRow key={`skeleton-${_i}`}>
                        <TableCell></TableCell>
                        <TableCell><div className="h-4 w-4 bg-muted rounded shimmer" /></TableCell>
                        <TableCell><div className="h-5 w-48 bg-muted rounded shimmer" /></TableCell>
                        <TableCell><div className="h-5 w-16 bg-muted rounded shimmer" /></TableCell>
                        <TableCell><div className="h-5 w-20 bg-muted rounded shimmer" /></TableCell>
                        <TableCell><div className="h-5 w-24 bg-muted rounded shimmer" /></TableCell>
                        <TableCell><div className="h-5 w-24 bg-muted rounded shimmer" /></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))
                  ) : filteredTargets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-[400px]">
                        <EmptyState
                          illustration={
                            targets.length === 0 ? (
                              <NoTargetsIllustration />
                            ) : (
                              <NoSearchResultsIllustration />
                            )
                          }
                          title={targets.length === 0 ? 'No targets yet' : 'No matching targets'}
                          description={
                            targets.length === 0
                              ? 'Create your first target to start monitoring pages for changes'
                              : 'Try adjusting your search or filters to find what you\'re looking for'
                          }
                          action={
                            targets.length === 0
                              ? {
                                  label: 'Create Your First Target',
                                  onClick: () => navigate('/targets/new'),
                                }
                              : undefined
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredTargets.map((target, index) => (
                        <Draggable key={target.id} draggableId={target.id} index={index}>
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`group cursor-pointer hover:bg-muted/30 transition-colors ${
                                snapshot.isDragging ? 'bg-muted/50 shadow-lg' : ''
                              }`}
                              onClick={() => navigate(`/targets/${target.id}`)}
                            >
                              <TableCell
                                {...provided.dragHandleProps}
                                onClick={(e) => e.stopPropagation()}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedTargets.has(target.id)}
                                  onCheckedChange={() => handleToggleSelect(target.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <StatusDot
                                    status={target.enabled ? (target.lastStatus ?? 'NEVER_RUN') : 'DISABLED'}
                                    size="md"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{target.name}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                      {target.url}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <StatusBadge
                                  status={target.enabled ? (target.lastStatus ?? 'NEVER_RUN') : 'DISABLED'}
                                  size="sm"
                                  errorMessage={target.lastError}
                                />
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {target.mode}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <RelativeTime date={target.lastRun} className="text-sm" />
                              </TableCell>
                              <TableCell>
                                {target.enabled ? (
                                  <Countdown targetDate={target.nextRun} className="text-sm" />
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleRun(target)}>
                                      <Play className="h-4 w-4 mr-2" />
                                      Run Now
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleEnabled(target)}>
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
                                    <DropdownMenuItem onClick={() => navigate(`/targets/${target.id}/edit`)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => copyUrl(target.url)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy URL
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => window.open(target.url, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open URL
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => setDeleteTarget(target)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </>
                  )}
                </TableBody>
              )}
            </Droppable>
          </Table>
        </DragDropContext>
      </motion.div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedTargets.size}
        onClear={() => setSelectedTargets(new Set())}
        onRun={handleBulkRun}
        onEnable={handleBulkEnable}
        onDisable={handleBulkDisable}
        onDelete={() => setShowBulkDelete(true)}
        onExport={handleBulkExport}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Target</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone and will remove all associated snapshots and change history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTargetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTargets.size} Targets</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTargets.size} targets? This action cannot be undone and will remove all associated snapshots and change history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedTargets.size} Targets
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </motion.div>
    </PullToRefresh>
  );
}
