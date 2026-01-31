import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useChanges, useTargets } from '@/lib/api/queries';
import type { Notification } from '@/components/NotificationCenter';
import { notifyChange, notifyError, getNotificationSettings } from '@/lib/desktop-notifications';

interface NotificationsContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}

const STORAGE_KEY = 'page-watcher-notifications';
const MAX_NOTIFICATIONS = 50;

function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // Ignore localStorage errors
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);
  const [lastChangeId, setLastChangeId] = useState<string | null>(null);

  // Poll for changes every 30 seconds
  const { data: changes } = useChanges();
  const { data: targets } = useTargets();

  // Detect new changes and create notifications
  useEffect(() => {
    if (!changes || changes.length === 0) return;

    const latestChange = changes[0];

    // If this is a new change (different from last known)
    if (lastChangeId && latestChange.id !== lastChangeId) {
      // Find the target that changed
      const target = targets?.find(t => t.id === latestChange.targetId);
      const targetName = target?.name || 'Unknown Target';

      const newNotification: Omit<Notification, 'id'> = {
        type: 'change',
        title: 'Changes detected',
        message: `New changes detected on ${targetName}`,
        timestamp: latestChange.createdAt,
        read: false,
        changeId: latestChange.id,
        targetId: latestChange.targetId,
      };

      addNotification(newNotification);

      // Show desktop notification if enabled
      const settings = getNotificationSettings();
      if (settings.enabled && settings.changes) {
        notifyChange(targetName, latestChange.id);
      }
    }

    // Update last known change ID
    if (latestChange.id !== lastChangeId) {
      setLastChangeId(latestChange.id);
    }
  }, [changes, targets, lastChangeId]);

  // Detect targets with errors
  useEffect(() => {
    if (!targets) return;

    const errorTargets = targets.filter(t => t.lastStatus === 'ERROR' && t.enabled);

    errorTargets.forEach(target => {
      setNotifications(prev => {
        // Check if we already have a recent error notification for this target
        const hasRecentError = prev.some(
          n => n.targetId === target.id &&
               n.type === 'error' &&
               new Date(n.timestamp).getTime() > Date.now() - 60000 * 5 // Last 5 minutes
        );

        if (!hasRecentError && target.lastError) {
          const newNotification: Notification = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'error',
            title: 'Monitor failed',
            message: `Failed to fetch ${target.name} - ${target.lastError}`,
            timestamp: target.lastRun || new Date().toISOString(),
            read: false,
            targetId: target.id,
          };
          const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
          saveNotifications(updated);

          // Show desktop notification if enabled
          const settings = getNotificationSettings();
          if (settings.enabled && settings.errors) {
            notifyError(target.name, target.lastError);
          }

          return updated;
        }
        return prev;
      });
    });
  }, [targets]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    setNotifications(prev => {
      const newNotification: Notification = {
        ...notification,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Persist notifications when they change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        dismiss,
        clearAll,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
