import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Volume2,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from '@/lib/desktop-notifications';
import { staggerContainer, staggerItem } from '@/lib/animations';

export default function SettingsPremium() {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());

  useEffect(() => {
    // Load settings on mount
    setSettings(getNotificationSettings());
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === 'granted') {
      toast.success('Notification permission granted!');
      setSettings(prev => ({ ...prev, enabled: true }));
      saveNotificationSettings({ ...settings, enabled: true });
    } else if (result === 'denied') {
      toast.error('Notification permission denied. Please enable it in your browser settings.');
    }
  };

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    toast.success('Settings saved');
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-4xl"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize your monitoring experience
        </p>
      </motion.div>

      {/* Desktop Notifications */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Desktop Notifications
            </CardTitle>
            <CardDescription>
              Get notified when changes are detected or monitors fail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Permission Status */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-1">
                <p className="font-medium">Browser Permission</p>
                <p className="text-sm text-muted-foreground">
                  {permission === 'granted'
                    ? 'Notifications are enabled'
                    : permission === 'denied'
                    ? 'Notifications are blocked'
                    : 'Permission not requested yet'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    permission === 'granted'
                      ? 'default'
                      : permission === 'denied'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="gap-1"
                >
                  {permission === 'granted' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Granted
                    </>
                  ) : permission === 'denied' ? (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      Denied
                    </>
                  ) : (
                    'Not Set'
                  )}
                </Badge>
                {permission !== 'granted' && (
                  <Button onClick={handleRequestPermission} size="sm">
                    Enable
                  </Button>
                )}
              </div>
            </div>

            {/* Settings */}
            {permission === 'granted' && (
              <div className="space-y-3">
                {/* Enable/Disable All */}
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="space-y-0.5">
                    <p className="font-medium">Enable Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Master switch for all desktop notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={() => handleToggleSetting('enabled')}
                  />
                </div>

                {settings.enabled && (
                  <>
                    {/* Changes */}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium">Change Notifications</p>
                          <p className="text-sm text-muted-foreground">
                            Alert me when changes are detected
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.changes}
                        onCheckedChange={() => handleToggleSetting('changes')}
                      />
                    </motion.div>

                    {/* Errors */}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium">Error Notifications</p>
                          <p className="text-sm text-muted-foreground">
                            Alert me when monitors fail
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.errors}
                        onCheckedChange={() => handleToggleSetting('errors')}
                      />
                    </motion.div>

                    {/* Sound */}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Volume2 className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium">Notification Sound</p>
                          <p className="text-sm text-muted-foreground">
                            Play sound with notifications
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.sound}
                        onCheckedChange={() => handleToggleSetting('sound')}
                      />
                    </motion.div>
                  </>
                )}
              </div>
            )}

            {permission === 'denied' && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-destructive">Notifications Blocked</p>
                    <p className="text-sm text-muted-foreground">
                      You've blocked notifications for this site. To enable them, click the lock icon
                      in your browser's address bar and change the notification permission.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* General Settings */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              General
            </CardTitle>
            <CardDescription>
              Application preferences and configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              More settings coming soon...
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
