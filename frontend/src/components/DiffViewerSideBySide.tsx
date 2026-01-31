import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import {
  Search,
  ChevronUp,
  ChevronDown,
  WrapText,
  Eye,
  Copy,
  Download,
  Maximize2,
  X,
  Columns,
  List,
  Code2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DiffLine {
  type: 'added' | 'removed' | 'context' | 'header';
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
}

interface DiffViewerSideBySideProps {
  diff: string;
  className?: string;
  maxHeight?: string;
}

function parseDiffForSideBySide(diff: string): { left: DiffLine[]; right: DiffLine[] } {
  const lines = diff.split('\n');
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
      if (match) {
        oldLineNum = parseInt(match[1], 10) - 1;
        newLineNum = parseInt(match[2], 10) - 1;
      }
      left.push({ type: 'header', content: line });
      right.push({ type: 'header', content: line });
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      newLineNum++;
      left.push({ type: 'context', content: '', lineNumber: undefined });
      right.push({ type: 'added', content: line.slice(1), lineNumber: newLineNum });
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      oldLineNum++;
      left.push({ type: 'removed', content: line.slice(1), oldLineNumber: oldLineNum });
      right.push({ type: 'context', content: '', lineNumber: undefined });
    } else if (line.startsWith(' ')) {
      oldLineNum++;
      newLineNum++;
      const content = line.slice(1);
      left.push({ type: 'context', content, oldLineNumber: oldLineNum });
      right.push({ type: 'context', content, lineNumber: newLineNum });
    } else if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
      left.push({ type: 'header', content: line });
      right.push({ type: 'header', content: line });
    }
  }

  return { left, right };
}

function parseDiffUnified(diff: string): DiffLine[] {
  const lines = diff.split('\n');
  const result: DiffLine[] = [];
  let lineNum = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      result.push({ type: 'header', content: line });
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
      if (match) {
        lineNum = parseInt(match[1], 10) - 1;
      }
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      lineNum++;
      result.push({ type: 'added', content: line.slice(1), lineNumber: lineNum });
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      result.push({ type: 'removed', content: line.slice(1) });
    } else if (line.startsWith(' ')) {
      lineNum++;
      result.push({ type: 'context', content: line.slice(1), lineNumber: lineNum });
    } else if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
      result.push({ type: 'header', content: line });
    } else if (line.trim()) {
      result.push({ type: 'context', content: line });
    }
  }

  return result;
}

export function DiffViewerSideBySide({ diff, className, maxHeight = '500px' }: DiffViewerSideBySideProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [wrapLines, setWrapLines] = useState(false);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'unified' | 'split' | 'inline'>('unified');

  const { left, right } = useMemo(() => parseDiffForSideBySide(diff), [diff]);
  const unifiedLines = useMemo(() => parseDiffUnified(diff), [diff]);

  const escapeRegex = useCallback((str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);

  const searchRegex = useMemo(() => {
    if (!searchQuery) return null;
    const escaped = escapeRegex(searchQuery);
    return new RegExp(`(${escaped})`, 'gi');
  }, [searchQuery, escapeRegex]);

  const matches = useMemo(() => {
    if (!searchQuery) return [];
    const lines = viewMode === 'split' ? [...left, ...right] : unifiedLines;
    return lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) =>
        line.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [viewMode, left, right, unifiedLines, searchQuery]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(diff);
      toast.success('Diff copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  }, [diff]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([diff], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'changes.diff';
      a.click();
      toast.success('Diff downloaded');
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [diff]);

  const navigateMatch = useCallback((direction: 'prev' | 'next') => {
    if (matches.length === 0) return;
    if (direction === 'next') {
      setCurrentMatch((prev) => (prev + 1) % matches.length);
    } else {
      setCurrentMatch((prev) => (prev - 1 + matches.length) % matches.length);
    }
  }, [matches.length]);

  const renderContent = useCallback((content: string, isMatch: boolean) => {
    let displayContent = content;
    if (showWhitespace) {
      displayContent = content
        .replace(/ /g, '·')
        .replace(/\t/g, '→   ');
    }

    if (searchQuery && isMatch && searchRegex) {
      const parts = displayContent.split(searchRegex);
      return parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={i} className="bg-warning/30 text-warning-foreground rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      );
    }

    return displayContent;
  }, [searchQuery, showWhitespace, searchRegex]);

  const stats = useMemo(() => {
    const added = unifiedLines.filter((l) => l.type === 'added').length;
    const removed = unifiedLines.filter((l) => l.type === 'removed').length;
    return { added, removed };
  }, [unifiedLines]);

  const renderSplitView = () => (
    <div className="flex divide-x divide-border">
      {/* Left side (removed) */}
      <div className="flex-1 font-mono text-xs">
        {left.map((line, index) => (
          <div
            key={`left-${index}`}
            className={cn(
              'flex min-h-[20px]',
              line.type === 'removed' && 'diff-removed',
              line.type === 'header' && 'bg-muted/50 text-muted-foreground'
            )}
          >
            <span className="w-12 flex-shrink-0 px-2 py-0.5 text-right text-muted-foreground select-none border-r border-border/50">
              {line.oldLineNumber || ''}
            </span>
            <span className="w-4 flex-shrink-0 text-center select-none">
              {line.type === 'removed' && '-'}
            </span>
            <pre
              className={cn(
                'flex-1 px-2 py-0.5',
                wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
              )}
            >
              {line.content}
            </pre>
          </div>
        ))}
      </div>

      {/* Right side (added) */}
      <div className="flex-1 font-mono text-xs">
        {right.map((line, index) => (
          <div
            key={`right-${index}`}
            className={cn(
              'flex min-h-[20px]',
              line.type === 'added' && 'diff-added',
              line.type === 'header' && 'bg-muted/50 text-muted-foreground'
            )}
          >
            <span className="w-12 flex-shrink-0 px-2 py-0.5 text-right text-muted-foreground select-none border-r border-border/50">
              {line.lineNumber || ''}
            </span>
            <span className="w-4 flex-shrink-0 text-center select-none">
              {line.type === 'added' && '+'}
            </span>
            <pre
              className={cn(
                'flex-1 px-2 py-0.5',
                wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
              )}
            >
              {line.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUnifiedView = () => (
    <div className="font-mono text-xs">
      {unifiedLines.map((line, index) => {
        const isMatchLine = matches.some((m) => m.index === index);
        const isCurrentMatch = matches[currentMatch]?.index === index;

        return (
          <div
            key={index}
            className={cn(
              'flex',
              line.type === 'added' && 'diff-added',
              line.type === 'removed' && 'diff-removed',
              line.type === 'header' && 'bg-muted/50 text-muted-foreground',
              isCurrentMatch && 'ring-2 ring-warning ring-inset'
            )}
          >
            <span className="w-12 flex-shrink-0 px-2 py-0.5 text-right text-muted-foreground select-none border-r border-border/50">
              {line.lineNumber || ''}
            </span>
            <span className="w-4 flex-shrink-0 text-center select-none">
              {line.type === 'added' && '+'}
              {line.type === 'removed' && '-'}
            </span>
            <pre
              className={cn(
                'flex-1 px-2 py-0.5',
                wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
              )}
            >
              {renderContent(line.content, isMatchLine)}
            </pre>
          </div>
        );
      })}
    </div>
  );

  const content = (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            <span className="text-success">+{stats.added}</span>
            {' / '}
            <span className="text-destructive">-{stats.removed}</span>
          </span>

          <div className="h-4 w-px bg-border mx-1" />

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="h-8">
            <TabsList className="h-8">
              <TabsTrigger value="unified" className="text-xs h-7 gap-1.5">
                <List className="h-3.5 w-3.5" />
                Unified
              </TabsTrigger>
              <TabsTrigger value="split" className="text-xs h-7 gap-1.5">
                <Columns className="h-3.5 w-3.5" />
                Split
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatch(0);
              }}
              className="h-7 w-40 pl-7 text-xs"
            />
          </div>

          {matches.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>
                {currentMatch + 1}/{matches.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => navigateMatch('prev')}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => navigateMatch('next')}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="h-4 w-px bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-7 w-7', wrapLines && 'bg-accent')}
                onClick={() => setWrapLines(!wrapLines)}
              >
                <WrapText className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Wrap lines</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-7 w-7', showWhitespace && 'bg-accent')}
                onClick={() => setShowWhitespace(!showWhitespace)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show whitespace</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy diff</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download .diff</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Diff content */}
      <ScrollArea style={{ maxHeight: isFullscreen ? 'calc(100vh - 120px)' : maxHeight }}>
        {viewMode === 'split' ? renderSplitView() : renderUnifiedView()}
      </ScrollArea>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background p-4">
        {content}
      </div>
    );
  }

  return content;
}
