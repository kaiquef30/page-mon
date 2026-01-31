
export type NotificationPermission = 'default' | 'granted' | 'denied';

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

export interface DesktopNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: unknown;
  onClick?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export async function showDesktopNotification(
  options: DesktopNotificationOptions
): Promise<Notification | null> {
  if (!isNotificationSupported()) {
    console.warn('Desktop notifications not supported');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge,
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      data: options.data,
    });

    if (options.onClick) {
      notification.onclick = () => {
        options.onClick?.();
        notification.close();
      };
    }

    if (options.onClose) {
      notification.onclose = options.onClose;
    }

    if (options.onError) {
      notification.onerror = options.onError;
    }

    return notification;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return null;
  }
}

export async function notifyChange(targetName: string, changeId: string): Promise<void> {
  await showDesktopNotification({
    title: '🔔 Changes Detected!',
    body: `New changes detected on ${targetName}`,
    tag: `change-${changeId}`,
    requireInteraction: true,
    onClick: () => {
      window.focus();
      window.location.href = `/changes/${changeId}`;
    },
  });
}

export async function notifyError(targetName: string, errorMessage: string): Promise<void> {
  await showDesktopNotification({
    title: '⚠️ Monitor Failed',
    body: `${targetName}: ${errorMessage}`,
    tag: `error-${targetName}`,
    onClick: () => {
      window.focus();
    },
  });
}

export function getNotificationPreference(key: string): boolean {
  const stored = localStorage.getItem(`notification-pref-${key}`);
  return stored === 'true';
}

export function setNotificationPreference(key: string, enabled: boolean): void {
  localStorage.setItem(`notification-pref-${key}`, enabled.toString());
}

export interface NotificationSettings {
  enabled: boolean;
  changes: boolean;
  errors: boolean;
  sound: boolean;
}

export function getNotificationSettings(): NotificationSettings {
  return {
    enabled: getNotificationPreference('enabled'),
    changes: getNotificationPreference('changes'),
    errors: getNotificationPreference('errors'),
    sound: getNotificationPreference('sound'),
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  setNotificationPreference('enabled', settings.enabled);
  setNotificationPreference('changes', settings.changes);
  setNotificationPreference('errors', settings.errors);
  setNotificationPreference('sound', settings.sound);
}
