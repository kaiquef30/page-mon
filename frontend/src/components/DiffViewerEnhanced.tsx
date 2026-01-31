import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  ChevronUp,
  ChevronDown,
  WrapText,
  Eye,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Columns,
  List,
} from 'lucide-react';
import { toast } from 'sonner';

interface DiffLine {
  type: 'added' | 'removed' | 'context' | 'header';
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
}

interface DiffViewerEnhancedProps {
  diff: string;
  className?: string;
  maxHeight?: string;
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

export function DiffViewerEnhanced({ diff, className, maxHeight = '500px' }: DiffViewerEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [wrapLines, setWrapLines] = useState(false);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(13);

  const unifiedLines = useMemo(() => parseDiffUnified(diff), [diff]);

  const matches = useMemo(() => {
    if (!searchQuery) return [];
    return unifiedLines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) =>
        line.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [unifiedLines, searchQuery]);

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

  const stats = useMemo(() => {
    const added = unifiedLines.filter((l) => l.type === 'added').length;
    const removed = unifiedLines.filter((l) => l.type === 'removed').length;
    return { added, removed };
  }, [unifiedLines]);

  const renderLine = useCallback((line: DiffLine, index: number) => {
    const isMatchLine = matches.some((m) => m.index === index);
    const isCurrentMatch = matches[currentMatch]?.index === index;

    let displayContent = line.content;
    if (showWhitespace) {
      displayContent = displayContent.replace(/ /g, '·').replace(/\t/g, '→   ');
    }

    if (searchQuery && isMatchLine) {
      const parts = displayContent.split(new RegExp(`(${searchQuery})`, 'gi'));
      displayContent = parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase()
          ? `<mark class="bg-warning/30 text-warning-foreground rounded px-0.5">${part}</mark>`
          : part
      ).join('');
    }

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.003, 0.5) }}
        className={cn(
          'flex hover:bg-accent/30 transition-colors',
          line.type === 'added' && 'diff-added',
          line.type === 'removed' && 'diff-removed',
          line.type === 'header' && 'bg-muted/50 text-muted-foreground font-semibold',
          isCurrentMatch && 'ring-2 ring-warning ring-inset'
        )}
        style={{ fontSize: `${fontSize}px` }}
      >
        <span className="w-14 flex-shrink-0 px-2 py-1 text-right text-muted-foreground select-none border-r border-border/30 bg-muted/20">
          {line.lineNumber || ''}
        </span>
        <span className="w-6 flex-shrink-0 text-center select-none font-bold">
          {line.type === 'added' && <span className="text-green-500">+</span>}
          {line.type === 'removed' && <span className="text-red-500">-</span>}
        </span>
        <pre
          className={cn(
            'flex-1 px-3 py-1',
            wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
          )}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      </motion.div>
    );
  }, [fontSize, wrapLines, showWhitespace, searchQuery, matches, currentMatch]);

  const content = (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden shadow-xl', className)}>
      {/* Enhanced Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 backdrop-blur-sm flex-wrap"
      >
        <div className="flex items-center gap-3">
          {/* Stats Badge */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-lg shadow-sm border border-border/50"
          >
            <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600 dark:text-green-400">
              <span className="text-lg font-bold">+{stats.added}</span>
            </Badge>
            <span className="text-muted-foreground">/</span>
            <Badge variant="outline" className="gap-1 border-red-500/30 text-red-600 dark:text-red-400">
              <span className="text-lg font-bold">-{stats.removed}</span>
            </Badge>
          </motion.div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in diff..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatch(0);
              }}
              className="h-9 w-48 pl-9 text-sm bg-background/50 backdrop-blur-sm"
            />
          </div>

          {matches.length > 0 && (
            <div className="flex items-center gap-1 text-sm bg-muted/50 rounded-lg px-3 py-1.5 backdrop-blur-sm">
              <span className="font-medium">
                {currentMatch + 1}/{matches.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigateMatch('prev')}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigateMatch('next')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="h-6 w-px bg-border" />

          {/* Zoom Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Decrease font size</TooltipContent>
          </Tooltip>

          <span className="text-sm text-muted-foreground font-mono min-w-[3ch] text-center">
            {fontSize}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Increase font size</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-border" />

          {/* View Options */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={wrapLines ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setWrapLines(!wrapLines)}
              >
                <WrapText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle line wrapping</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showWhitespace ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowWhitespace(!showWhitespace)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show whitespace</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-border" />

          {/* Actions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy to clipboard</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-purple-500/10 hover:text-purple-500"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download diff file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Exit' : 'Fullscreen'}</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

      {/* Diff Content */}
      <ScrollArea style={{ maxHeight: isFullscreen ? 'calc(100vh - 100px)' : maxHeight }}>
        <div className="font-mono text-sm">
          {unifiedLines.map((line, index) => renderLine(line, index))}
        </div>
      </ScrollArea>
    </div>
  );

  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-6 flex flex-col"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
