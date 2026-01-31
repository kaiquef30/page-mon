import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface DiffViewerProps {
  diff: string;
  className?: string;
  maxHeight?: string;
}

interface DiffLine {
  type: 'added' | 'removed' | 'context' | 'header';
  content: string;
  lineNumber?: number;
}

function parseDiff(diff: string): DiffLine[] {
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

export function DiffViewer({ diff, className, maxHeight = '500px' }: DiffViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [wrapLines, setWrapLines] = useState(false);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lines = useMemo(() => parseDiff(diff), [diff]);

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
    return lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) =>
        line.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [lines, searchQuery]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(diff);
    toast.success('Diff copied to clipboard');
  }, [diff]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([diff], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'changes.diff';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Diff downloaded');
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
      return parts.map((part, _i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={_i} className="bg-warning/30 text-warning-foreground rounded px-0.5">
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
    const added = lines.filter((l) => l.type === 'added').length;
    const removed = lines.filter((l) => l.type === 'removed').length;
    return { added, removed };
  }, [lines]);

  const content = (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            <span className="text-success">+{stats.added}</span>
            {' / '}
            <span className="text-destructive">-{stats.removed}</span>
          </span>
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
        <div className="font-mono text-xs">
          {lines.map((line, index) => {
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
