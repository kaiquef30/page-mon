import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTargets, useRunTarget, useUpdateTarget, useDeleteTarget } from '@/lib/api/queries';
import type { Target, TargetStatus, TargetMode } from '@/lib/api/types';
import { StatusBadge, StatusDot } from '@/components/StatusBadge';
import { Countdown, RelativeTime } from '@/components/Countdown';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { TargetGridView } from '@/components/TargetGridView';
import { TargetKanbanView } from '@/components/TargetKanbanView';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { TagManager, type Tag } from '@/components/TagManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Table as TableIcon,
  Grid as GridIcon,
  LayoutKanban,
  Tag as TagIcon,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { toast } from 'sonner';

type FilterStatus = 'all' | TargetStatus | 'enabled' | 'disabled';
type FilterMode = 'all' | TargetMode;
type ViewMode = 'table' | 'grid' | 'kanban';
type SortField = 'name' | 'status' | 'lastRun' | 'nextRun';
type SortDirection = 'asc' | 'desc';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Mock tags data (in a real app, this would come from API/localStorage)
const MOCK_TAGS: Tag[] = [
  { id: '1', name: 'Production', color: '#ef4444' },
  { id: '2', name: 'Critical', color: '#f59e0b' },
  { id: '3', name: 'Marketing', color: '#10b981' },
  { id: '4', name: 'Development', color: '#3b82f6' },
];

export default function TargetsListEnhanced() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [modeFilter, setModeFilter] = useState<FilterMode>('all');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Target | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Mock target tags mapping
  const [targetTags] = useState<Record<string, string[]>>({});

  const { data: targets = [], isLoading, error, refetch } = useTargets();
  const runTargetMutation = useRunTarget();
  const updateTargetMutation = useUpdateTarget();
  const deleteTargetMutation = useDeleteTarget();

  const debouncedSearch = useDebounce(search, 300);

  const filteredAndSortedTargets = useMemo(() => {
    let filtered = targets.filter((target) => {
      // Search filter
      const matchesSearch =
        !debouncedSearch ||
        target.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        target.url.toLowerCase().includes(debouncedSearch.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'enabled') {
        matchesStatus = target.enabled;
      } else if (statusFilter === 'disabled') {
        matchesStatus = !target.enabled;
      } else if (statusFilter !== 'all') {
        matchesStatus = target.lastStatus === statusFilter;
      }

      // Mode filter
      const matchesMode = modeFilter === 'all' || target.mode === modeFilter;

      // Tag filter
      const matchesTags =
        tagFilter.length === 0 ||
        tagFilter.some((tagId) => targetTags[target.id]?.includes(tagId));

      return matchesSearch && matchesStatus && matchesMode && matchesTags;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = (a.lastStatus || '').localeCompare(b.lastStatus || '');
          break;
        case 'lastRun':
          comparison = new Date(a.lastRun || 0).getTime() - new Date(b.lastRun || 0).getTime();
          break;
        case 'nextRun':
          comparison = new Date(a.nextRun || 0).getTime() - new Date(b.nextRun || 0).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [targets, debouncedSearch, statusFilter, modeFilter, tagFilter, targetTags, sortField, sortDirection]);

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

  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  }, []);

  const handleToggleSelect = useCallback((targetId: string) => {
    setSelectedTargets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(targetId)) {
        newSet.delete(targetId);
      } else {
        newSet.add(targetId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedTargets.size === filteredAndSortedTargets.length) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(filteredAndSortedTargets.map((t) => t.id)));
    }
  }, [filteredAndSortedTargets, selectedTargets.size]);

  const handleBulkRun = useCallback(async () => {
    const targetsToRun = targets.filter((t) => selectedTargets.has(t.id));
    toast.promise(
      Promise.all(targetsToRun.map((t) => runTargetMutation.mutateAsync({ id: t.id }))),
      {
        loading: `Running ${targetsToRun.length} targets...`,
        success: `Successfully ran ${targetsToRun.length} targets`,
        error: 'Some targets failed to run',
      }
    );
    setSelectedTargets(new Set());
  }, [targets, selectedTargets, runTargetMutation]);

  const handleBulkEnable = useCallback(async () => {
    const targetsToEnable = targets.filter((t) => selectedTargets.has(t.id));
    toast.promise(
      Promise.all(
        targetsToEnable.map((t) => updateTargetMutation.mutateAsync({ id: t.id, data: { enabled: true } }))
      ),
      {
        loading: `Enabling ${targetsToEnable.length} targets...`,
        success: `Enabled ${targetsToEnable.length} targets`,
        error: 'Failed to enable some targets',
      }
    );
    setSelectedTargets(new Set());
  }, [targets, selectedTargets, updateTargetMutation]);

  const handleBulkDisable = useCallback(async () => {
    const targetsToDisable = targets.filter((t) => selectedTargets.has(t.id));
    toast.promise(
      Promise.all(
        targetsToDisable.map((t) => updateTargetMutation.mutateAsync({ id: t.id, data: { enabled: false } }))
      ),
      {
        loading: `Disabling ${targetsToDisable.length} targets...`,
        success: `Disabled ${targetsToDisable.length} targets`,
        error: 'Failed to disable some targets',
      }
    );
    setSelectedTargets(new Set());
  }, [targets, selectedTargets, updateTargetMutation]);

  const handleBulkDelete = useCallback(async () => {
    const targetsToDelete = targets.filter((t) => selectedTargets.has(t.id));
    if (!confirm(`Are you sure you want to delete ${targetsToDelete.length} targets?`)) return;

    toast.promise(
      Promise.all(targetsToDelete.map((t) => deleteTargetMutation.mutateAsync(t.id))),
      {
        loading: `Deleting ${targetsToDelete.length} targets...`,
        success: `Deleted ${targetsToDelete.length} targets`,
        error: 'Failed to delete some targets',
      }
    );
    setSelectedTargets(new Set());
  }, [targets, selectedTargets, deleteTargetMutation]);

  const handleBulkExport = useCallback(() => {
    const targetsToExport = targets.filter((t) => selectedTargets.has(t.id));
    const dataStr = JSON.stringify(targetsToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `targets-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Targets exported');
  }, [targets, selectedTargets]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load targets'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Targets</h1>
          <p className="text-muted-foreground text-sm">
            Manage your monitored pages ({filteredAndSortedTargets.length} of {targets.length})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/targets/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Target
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and View Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
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

          <TagManager
            tags={MOCK_TAGS}
            selectedTags={tagFilter}
            onToggleTag={(tagId) => {
              setTagFilter((prev) =>
                prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
              );
            }}
            mode="filter"
          />

          <div className="h-9 w-px bg-border hidden sm:block" />

          {/* View mode toggle */}
          <div className="flex items-center gap-1 border border-border rounded-md p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-7 w-7 p-0"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 w-7 p-0"
            >
              <GridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-7 w-7 p-0"
            >
              <LayoutKanban className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filters */}
        {(statusFilter !== 'all' || modeFilter !== 'all' || tagFilter.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="ml-1">
                  ×
                </button>
              </Badge>
            )}
            {modeFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Mode: {modeFilter}
                <button onClick={() => setModeFilter('all')} className="ml-1">
                  ×
                </button>
              </Badge>
            )}
            {tagFilter.map((tagId) => {
              const tag = MOCK_TAGS.find((t) => t.id === tagId);
              return tag ? (
                <Badge
                  key={tagId}
                  variant="secondary"
                  className="gap-1"
                  style={{ borderColor: tag.color }}
                >
                  {tag.name}
                  <button
                    onClick={() => setTagFilter((prev) => prev.filter((id) => id !== tagId))}
                    className="ml-1"
                  >
                    ×
                  </button>
                </Badge>
              ) : null;
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setModeFilter('all');
                setTagFilter([]);
              }}
              className="h-6 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAndSortedTargets.length === 0 ? (
        <EmptyState
          icon={<TargetIcon className="h-6 w-6 text-muted-foreground" />}
          title={targets.length === 0 ? 'No targets yet' : 'No matching targets'}
          description={
            targets.length === 0
              ? 'Create your first target to start monitoring'
              : 'Try adjusting your filters'
          }
          action={
            targets.length === 0
              ? {
                  label: 'Create Target',
                  onClick: () => navigate('/targets/new'),
                }
              : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <TargetGridView
          targets={filteredAndSortedTargets}
          onRun={handleRun}
          onToggleEnabled={handleToggleEnabled}
          onDelete={setDeleteTarget}
          onCopyUrl={copyUrl}
          selectedTargets={selectedTargets}
          onToggleSelect={handleToggleSelect}
          showCheckboxes={selectedTargets.size > 0}
        />
      ) : viewMode === 'kanban' ? (
        <TargetKanbanView
          targets={filteredAndSortedTargets}
          onRun={handleRun}
          onToggleEnabled={handleToggleEnabled}
          onDelete={setDeleteTarget}
          onCopyUrl={copyUrl}
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={
                      filteredAndSortedTargets.length > 0 &&
                      selectedTargets.size === filteredAndSortedTargets.length
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-border"
                  />
                </TableHead>
                <TableHead className="w-[300px]">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Name
                    {sortField === 'name' &&
                      (sortDirection === 'asc' ? (
                        <SortAsc className="h-3.5 w-3.5" />
                      ) : (
                        <SortDesc className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Status
                    {sortField === 'status' &&
                      (sortDirection === 'asc' ? (
                        <SortAsc className="h-3.5 w-3.5" />
                      ) : (
                        <SortDesc className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('lastRun')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Last Run
                    {sortField === 'lastRun' &&
                      (sortDirection === 'asc' ? (
                        <SortAsc className="h-3.5 w-3.5" />
                      ) : (
                        <SortDesc className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('nextRun')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Next Run
                    {sortField === 'nextRun' &&
                      (sortDirection === 'asc' ? (
                        <SortAsc className="h-3.5 w-3.5" />
                      ) : (
                        <SortDesc className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTargets.map((target) => (
                <TableRow
                  key={target.id}
                  className="group cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/targets/${target.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedTargets.has(target.id)}
                      onChange={() => handleToggleSelect(target.id)}
                      className="h-4 w-4 rounded border-border"
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
                        <DropdownMenuItem onClick={() => window.open(target.url, '_blank')}>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedTargets.size}
        onClearSelection={() => setSelectedTargets(new Set())}
        onRunAll={handleBulkRun}
        onEnableAll={handleBulkEnable}
        onDisableAll={handleBulkDisable}
        onDeleteAll={handleBulkDelete}
        onExportSelected={handleBulkExport}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Target</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone and will remove
              all associated snapshots and change history.
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
    </motion.div>
  );
}
