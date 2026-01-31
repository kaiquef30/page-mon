import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  Command,
  Search,
  Plus,
  Home,
  Target,
  Bell,
  Settings,
  Moon,
  Keyboard,
} from 'lucide-react';
import { modalContent } from '@/lib/animations';

interface Shortcut {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface ShortcutCategory {
  title: string;
  shortcuts: Shortcut[];
}

const shortcuts: ShortcutCategory[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette', icon: <Command className="h-4 w-4" /> },
      { keys: ['G', 'D'], description: 'Go to Dashboard', icon: <Home className="h-4 w-4" /> },
      { keys: ['G', 'T'], description: 'Go to Targets', icon: <Target className="h-4 w-4" /> },
      { keys: ['G', 'N'], description: 'Go to Notifications', icon: <Bell className="h-4 w-4" /> },
      { keys: ['G', 'S'], description: 'Go to Settings', icon: <Settings className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['C'], description: 'Create new target', icon: <Plus className="h-4 w-4" /> },
      { keys: ['/', '/'], description: 'Focus search', icon: <Search className="h-4 w-4" /> },
      { keys: ['⌘', 'T'], description: 'Toggle theme', icon: <Moon className="h-4 w-4" /> },
      { keys: ['?'], description: 'Show keyboard shortcuts', icon: <Keyboard className="h-4 w-4" /> },
      { keys: ['Esc'], description: 'Close dialogs/modals' },
    ],
  },
  {
    title: 'Targets List',
    shortcuts: [
      { keys: ['⌘', 'A'], description: 'Select all targets' },
      { keys: ['⌘', 'D'], description: 'Deselect all' },
      { keys: ['Enter'], description: 'Open selected target' },
      { keys: ['Delete'], description: 'Delete selected targets' },
    ],
  },
  {
    title: 'Diff Viewer',
    shortcuts: [
      { keys: ['⌘', '+'], description: 'Increase font size' },
      { keys: ['⌘', '-'], description: 'Decrease font size' },
      { keys: ['⌘', 'C'], description: 'Copy diff' },
      { keys: ['⌘', 'F'], description: 'Search in diff' },
      { keys: ['F'], description: 'Toggle fullscreen' },
    ],
  },
];

function KeyboardKey({ k }: { k: string }) {
  return (
    <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded shadow-sm min-w-[2ch] inline-flex items-center justify-center">
      {k}
    </kbd>
  );
}

// Context for programmatic control
interface KeyboardShortcutsContextValue {
  isOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcutsModal() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsModal must be used within KeyboardShortcutsProvider');
  }
  return context;
}

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openShortcuts = () => setIsOpen(true);
  const closeShortcuts = () => setIsOpen(false);

  return (
    <KeyboardShortcutsContext.Provider value={{ isOpen, openShortcuts, closeShortcuts }}>
      {children}
      <KeyboardShortcutsModal isOpen={isOpen} onClose={closeShortcuts} />
    </KeyboardShortcutsContext.Provider>
  );
}

function KeyboardShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [open, setOpen] = useState(false);

  // Sync with prop
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts modal with ?
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }

      // Close with Escape
      if (e.key === 'Escape' && open) {
        setOpen(false);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Keyboard className="h-6 w-6" />
                  Keyboard Shortcuts
                </DialogTitle>
                <DialogDescription>
                  Master these shortcuts to boost your productivity
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6 mt-4">
                  {shortcuts.map((category, categoryIndex) => (
                    <motion.div
                      key={category.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: categoryIndex * 0.1 }}
                    >
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        {category.title}
                        <Badge variant="secondary" className="text-xs">
                          {category.shortcuts.length}
                        </Badge>
                      </h3>
                      <div className="space-y-2">
                        {category.shortcuts.map((shortcut, shortcutIndex) => (
                          <motion.div
                            key={shortcutIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: categoryIndex * 0.1 + shortcutIndex * 0.05 }}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              {shortcut.icon && (
                                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                                  {shortcut.icon}
                                </div>
                              )}
                              <span className="text-sm">{shortcut.description}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <span key={keyIndex} className="flex items-center gap-1">
                                  <KeyboardKey k={key} />
                                  {keyIndex < shortcut.keys.length - 1 && (
                                    <span className="text-muted-foreground text-sm mx-0.5">+</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pro tip */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg"
                >
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Pro tip:</span> Press{' '}
                    <KeyboardKey k="?" /> at any time to see this shortcuts guide
                  </p>
                </motion.div>
              </ScrollArea>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

// Hook to use keyboard shortcuts
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  options: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't trigger if user is typing in an input
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const matchesModifiers =
        (!options.ctrl || e.ctrlKey) &&
        (!options.meta || e.metaKey) &&
        (!options.shift || e.shiftKey) &&
        (!options.alt || e.altKey);

      const matchesKey = keys.some(key => e.key.toLowerCase() === key.toLowerCase());

      if (matchesKey && matchesModifiers) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, callback, options]);
}
