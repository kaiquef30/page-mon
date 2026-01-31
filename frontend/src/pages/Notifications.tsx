import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useDiscordNotification,
  useUpdateDiscordNotification,
  useDeleteDiscordNotification,
  useTestDiscordNotification,
} from '@/lib/api/queries';
import { ErrorState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/Skeleton';
import {
  MessageSquare,
  Save,
  Trash2,
  Send,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const DiscordFormSchema = z
  .object({
    enabled: z.boolean(),
    webhookUrl: z.string().optional().or(z.literal('')),
    maxDiffChars: z.number().min(200).max(4000),
  })
  .superRefine((val, ctx) => {
    if (!val.enabled) return;
    if (!val.webhookUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['webhookUrl'],
        message: 'Webhook URL is required when Discord notifications are enabled',
      });
      return;
    }
    try {
      new URL(val.webhookUrl);
      if (!/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(val.webhookUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['webhookUrl'],
          message: 'Must be a Discord webhook URL',
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['webhookUrl'],
        message: 'Must be a valid URL',
      });
    }
  });

type DiscordFormData = z.infer<typeof DiscordFormSchema>;

export default function Notifications() {
  const [showWebhook, setShowWebhook] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [localWebhookValue, setLocalWebhookValue] = useState('');

  const { data: discord, isLoading, error, refetch } = useDiscordNotification();
  const updateMutation = useUpdateDiscordNotification();
  const deleteMutation = useDeleteDiscordNotification();
  const testMutation = useTestDiscordNotification();

  // DefaultValues estáveis (não dependem do discord async)
  const form = useForm<DiscordFormData>({
    resolver: zodResolver(DiscordFormSchema),
    defaultValues: {
      enabled: false,
      webhookUrl: '',
      maxDiffChars: 2000,
    },
  });

  // Atualiza o form quando o discord carregar, sem causar loop
  useEffect(() => {
    if (!discord) return;
    if (form.formState.isDirty) return;

    form.reset({
      enabled: discord.enabled ?? false,
      webhookUrl: '',
      maxDiffChars: discord.maxDiffChars ?? 2000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discord?.enabled, discord?.maxDiffChars, form]);

  const onSubmit = async (data: DiscordFormData) => {
    try {
      await updateMutation.mutateAsync({
        enabled: data.enabled,
        webhookUrl: data.enabled ? data.webhookUrl || null : null,
        maxDiffChars: data.maxDiffChars,
      });
      toast.success('Discord notifications updated');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync();
      if (result.success) {
        toast.success('Test notification sent!');
      } else {
        toast.error(result.message || 'Test failed');
      }
    } catch {
      toast.error('Failed to send test notification');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      toast.success('Discord notifications removed');
      form.reset({
        enabled: false,
        webhookUrl: '',
        maxDiffChars: 2000,
      });
      setShowDeleteDialog(false);
    } catch {
      toast.error('Failed to remove notifications');
    }
  };


  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load notifications'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Configure how you receive change notifications
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Discord Webhook
                </CardTitle>
                <CardDescription>
                  Receive notifications in a Discord channel when changes are detected
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enabled</FormLabel>
                        <FormDescription>
                          Send notifications when changes are detected
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="webhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook URL</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showWebhook ? 'text' : 'password'}
                            placeholder="https://discord.com/api/webhooks/..."
                            aria-label="Discord Webhook URL"
                            aria-describedby="webhook-description"
                            value={showWebhook ? localWebhookValue : (discord?.webhookUrlMasked ?? '')}
                            onChange={(e) => {
                              if (showWebhook) {
                                setLocalWebhookValue(e.target.value);
                                form.setValue('webhookUrl', e.target.value, { shouldDirty: true });
                              }
                            }}
                            onFocus={() => setShowWebhook(true)}
                            onBlur={() => setShowWebhook(false)}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowWebhook(!showWebhook)}
                        >
                          {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      <FormDescription id="webhook-description">
                        {discord?.webhookUrlMasked
                          ? `Current: ${discord.webhookUrlMasked}`
                          : 'No webhook configured yet.'}{' '}
                        Create a webhook in your Discord server settings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxDiffChars"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Max Diff Characters</FormLabel>
                        <span className="text-sm text-muted-foreground">
                          {field.value.toLocaleString()}
                        </span>
                      </div>
                      <FormControl>
                        <Slider
                          min={200}
                          max={4000}
                          step={100}
                          value={[field.value]}
                          onValueChange={([v]) => field.onChange(v)}
                        />
                      </FormControl>
                      <FormDescription>
                        Limit diff length in notifications to avoid Discord message limits
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                  <p className="text-xs text-warning">
                    Keep your webhook URL secure. Anyone with access can send messages to your channel.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {discord && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTest}
                    disabled={
                      testMutation.isPending || !discord.enabled || !discord.webhookUrlMasked
                    }
                    className="gap-2"
                  >
                    {testMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Test
                  </Button>
                )}

                {discord && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Button
                type="submit"
                disabled={updateMutation.isPending || !form.formState.isDirty}
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Discord Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your Discord webhook configuration. You can set up a new webhook later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
