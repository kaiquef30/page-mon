import { motion } from 'framer-motion';
import { useHealth } from '@/lib/api/queries';
import { API_BASE_URL } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Server,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Globe,
  Loader2,
} from 'lucide-react';

export default function Settings() {
  const { data: health, isLoading, error, refetch, isFetching } = useHealth();

  const isOnline = health?.status === 'UP';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-2xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          System configuration and status
        </p>
      </div>

      {/* Backend Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            Backend Connection
          </CardTitle>
          <CardDescription>
            API server connectivity status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : isOnline ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">
                  {isLoading ? 'Checking...' : isOnline ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {API_BASE_URL}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : 'Connection failed'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            API Documentation
          </CardTitle>
          <CardDescription>
            Swagger UI for the backend API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(`${API_BASE_URL}/swagger-ui`, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Open Swagger UI
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Application</span>
            <span className="font-medium">Page Change Monitor</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Frontend Version</span>
            <Badge variant="secondary">1.0.0</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">API Base URL</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">{API_BASE_URL}</code>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
          <CardDescription>
            Quick navigation and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <ShortcutItem shortcut="⌘ K" description="Open command palette" />
            <ShortcutItem shortcut="⌘ T" description="Toggle theme" />
            <ShortcutItem shortcut="G D" description="Go to Dashboard" />
            <ShortcutItem shortcut="G T" description="Go to Targets" />
            <ShortcutItem shortcut="G N" description="Go to Notifications" />
            <ShortcutItem shortcut="G S" description="Go to Settings" />
            <ShortcutItem shortcut="C" description="Create new target" />
            <ShortcutItem shortcut="/" description="Focus search" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{description}</span>
      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{shortcut}</kbd>
    </div>
  );
}
