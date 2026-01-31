import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import {
  Play,
  Power,
  PowerOff,
  Trash2,
  X,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onRun: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onDelete: () => void;
  onExport: () => void;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  onRun,
  onEnable,
  onDisable,
  onDelete,
  onExport,
  className,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
            'bg-card border border-border rounded-full shadow-2xl',
            'px-6 py-4',
            className
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {selectedCount} selected
              </span>
            </div>

            <div className="h-8 w-px bg-border" />

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRun}
                className="gap-2 hover:bg-blue-500/10 hover:text-blue-500"
              >
                <Play className="h-4 w-4" />
                Run
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onEnable}
                className="gap-2 hover:bg-green-500/10 hover:text-green-500"
              >
                <Power className="h-4 w-4" />
                Enable
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onDisable}
                className="gap-2 hover:bg-yellow-500/10 hover:text-yellow-500"
              >
                <PowerOff className="h-4 w-4" />
                Disable
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                className="gap-2 hover:bg-purple-500/10 hover:text-purple-500"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="gap-2 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>

            <div className="h-8 w-px bg-border" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
