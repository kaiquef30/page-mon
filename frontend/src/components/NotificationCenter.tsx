import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  TrendingUp,
  X,
  ExternalLink,
} from 'lucide-react';
import { RelativeTime } from './Countdown';
import { Link } from 'react-router-dom';

export interface Notification {
  id: string;
  type: 'change' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetId?: string;
  changeId?: string;
  link?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'changes' | 'errors'>('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    } else if (filter === 'changes') {
      filtered = filtered.filter((n) => n.type === 'change');
    } else if (filter === 'errors') {
      filtered = filtered.filter((n) => n.type === 'error');
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, filter]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'change':
        return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'success':
        return <Check className="h-4 w-4 text-success" />;
      case 'info':
        return <Info className="h-4 w-4 text-info" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="h-7 text-xs gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread
            </TabsTrigger>
            <TabsTrigger value="changes" className="text-xs">
              Changes
            </TabsTrigger>
            <TabsTrigger value="errors" className="text-xs">
              Errors
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="m-0">
            <ScrollArea className="h-[400px]">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 px-4 text-center"
                  >
                    <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No notifications
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You're all caught up!
                    </p>
                  </motion.div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                      className={`group border-b border-border last:border-0 ${
                        !notification.read ? 'bg-accent/30' : ''
                      }`}
                    >
                      <div className="px-4 py-3 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getIcon(notification.type)}</div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-medium leading-tight">
                                {notification.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDismiss(notification.id)}
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between pt-1">
                              <RelativeTime
                                date={notification.timestamp}
                                className="text-xs text-muted-foreground"
                              />

                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onMarkAsRead(notification.id)}
                                    className="h-6 text-xs gap-1"
                                  >
                                    <Check className="h-3 w-3" />
                                    Mark read
                                  </Button>
                                )}

                                {(notification.link || notification.targetId || notification.changeId) && (
                                  <Link
                                    to={
                                      notification.link ||
                                      (notification.changeId
                                        ? `/changes/${notification.changeId}`
                                        : `/targets/${notification.targetId}`)
                                    }
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs gap-1"
                                    >
                                      View
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
