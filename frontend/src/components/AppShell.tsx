import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCommandPalette } from './CommandPalette';
import { useHealth } from '@/lib/api/queries';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '@/contexts/NotificationsContext';
import {
  LayoutDashboard,
  Target,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/targets', icon: Target, label: 'Targets' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { setOpen: openCommandPalette, theme, toggleTheme } = useCommandPalette();
  const { data: health } = useHealth();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
  } = useNotifications();

  const isOnline = health?.status === 'UP';

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-out flex flex-col',
          sidebarCollapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">
                PageMon
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center mx-auto">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          {/* Connection status */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                  sidebarCollapsed && 'justify-center'
                )}
              >
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-success" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
                {!sidebarCollapsed && (
                  <span className="text-muted-foreground">
                    {isOnline ? 'Connected' : 'Offline'}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isOnline ? 'Backend connected' : 'Backend unreachable'}
            </TooltipContent>
          </Tooltip>

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              'w-full justify-start gap-3 text-sidebar-foreground',
              sidebarCollapsed && 'justify-center'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-200',
          sidebarCollapsed ? 'ml-16' : 'ml-56'
        )}
      >
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-2 text-muted-foreground"
              onClick={() => openCommandPalette(true)}
            >
              <Search className="h-4 w-4" />
              <span>Search...</span>
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 hidden sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDismiss={dismiss}
              onClearAll={clearAll}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Link to="/targets/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Target</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
