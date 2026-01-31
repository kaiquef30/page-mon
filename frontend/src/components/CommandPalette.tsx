import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Home,
  Target,
  Bell,
  Settings,
  Plus,
  Moon,
  Sun,
  Search,
  Keyboard,
} from 'lucide-react';
import { useTargets } from '@/lib/api/queries';
import { StatusDot } from './StatusBadge';
import { useKeyboardShortcutsModal } from './KeyboardShortcuts';
import { toast } from 'sonner';

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Command Palette: Cmd+K or Ctrl+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Theme Toggle: Cmd+T or Ctrl+T
      if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggleTheme]);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, theme, toggleTheme }}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

function CommandPalette() {
  const { open, setOpen, theme, toggleTheme } = useCommandPalette();
  const { openShortcuts } = useKeyboardShortcutsModal();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: targets = [] } = useTargets();

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => navigate('/'))}
            className={cn(location.pathname === '/' && 'bg-accent')}
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/targets'))}
            className={cn(location.pathname === '/targets' && 'bg-accent')}
          >
            <Target className="mr-2 h-4 w-4" />
            <span>Targets</span>
            <CommandShortcut>G T</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/notifications'))}
          >
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
            <CommandShortcut>G N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/settings'))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => navigate('/targets/new'))}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Target</span>
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(toggleTheme)}>
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle Theme</span>
            <CommandShortcut>⌘ T</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {targets.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Targets">
              {targets.slice(0, 10).map((target) => (
                <CommandItem
                  key={target.id}
                  onSelect={() =>
                    runCommand(() => navigate(`/targets/${target.id}`))
                  }
                >
                  <StatusDot
                    status={target.enabled ? (target.lastStatus || 'NEVER_RUN') : 'DISABLED'}
                    className="mr-2"
                  />
                  <span className="flex-1 truncate">{target.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {target.url}
                  </span>
                </CommandItem>
              ))}
              {targets.length > 10 && (
                <CommandItem
                  onSelect={() => runCommand(() => navigate('/targets'))}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>View all {targets.length} targets...</span>
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Help">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                openShortcuts();
              })
            }
          >
            <Keyboard className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
