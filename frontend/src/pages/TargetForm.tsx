import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { CreateTargetSchema, CreateTarget } from '@/lib/api/types';
import { useTarget, useCreateTarget, useUpdateTarget } from '@/lib/api/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ArrowLeft,
  Save,
  Loader2,
  X,
  Plus,
  Globe,
  Clock,
  Code2,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

const intervalPresets = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '24 hours' },
];

export default function TargetForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const targetId = id || '';

  const { data: existingTarget, isLoading: loadingTarget } = useTarget(targetId);
  const createMutation = useCreateTarget();
  const updateMutation = useUpdateTarget();

  const [ignoreRegexInput, setIgnoreRegexInput] = useState('');

  const form = useForm<CreateTarget>({
    resolver: zodResolver(CreateTargetSchema),
    defaultValues: {
      name: '',
      url: '',
      mode: 'TEXT',
      cssSelector: '',
      textRegex: '',
      ignoreRegexes: [],
      intervalMinutes: 60,
      enabled: true,
    },
  });

  // Load existing target data when editing
  useEffect(() => {
    if (existingTarget) {
      form.reset({
        name: existingTarget.name,
        url: existingTarget.url,
        mode: existingTarget.mode,
        cssSelector: existingTarget.cssSelector ?? '',
        textRegex: '',
        ignoreRegexes: existingTarget.ignoreRegexes ?? [],
        intervalMinutes: existingTarget.intervalMinutes,
        enabled: existingTarget.enabled,
      });
    }
  }, [existingTarget, form]);

  const onSubmit = async (data: CreateTarget) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: targetId, data });
        toast.success('Target updated successfully');
        navigate(`/targets/${targetId}`);
      } else {
        const created = await createMutation.mutateAsync(data);
        toast.success('Target created successfully');
        navigate(`/targets/${created.id}`);
      }
    } catch (err) {
      toast.error(isEditing ? 'Failed to update target' : 'Failed to create target');
    }
  };

  const addIgnoreRegex = () => {
    if (!ignoreRegexInput.trim()) return;

    // Validate regex
    try {
      new RegExp(ignoreRegexInput);
    } catch {
      toast.error('Invalid regular expression');
      return;
    }

    const current = form.getValues('ignoreRegexes') ?? [];
    if (!current.includes(ignoreRegexInput)) {
      form.setValue('ignoreRegexes', [...current, ignoreRegexInput]);
    }
    setIgnoreRegexInput('');
  };

  const removeIgnoreRegex = (regex: string) => {
    const current = form.getValues('ignoreRegexes') ?? [];
    form.setValue('ignoreRegexes', current.filter((r) => r !== regex));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingTarget) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(isEditing ? `/targets/${targetId}` : '/targets')}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Target' : 'Create Target'}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Configure the target URL and display name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Website" {...field} />
                    </FormControl>
                    <FormDescription>
                      A friendly name to identify this target
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/page"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The full URL of the page to monitor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enabled</FormLabel>
                      <FormDescription>
                        Start monitoring immediately after creation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Monitoring Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Monitoring Settings
              </CardTitle>
              <CardDescription>
                Configure how often and how to check for changes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="intervalMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Interval</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(parseInt(v, 10))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {intervalPresets.map((preset) => (
                          <SelectItem key={preset.value} value={String(preset.value)}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often to check for changes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TEXT">
                          <div className="flex items-center gap-2">
                            <span>Text</span>
                            <span className="text-xs text-muted-foreground">
                              (Fast, HTTP only)
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="PLAYWRIGHT">
                          <div className="flex items-center gap-2">
                            <span>Playwright</span>
                            <span className="text-xs text-muted-foreground">
                              (JavaScript support)
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Text mode is faster but doesn't execute JavaScript
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Selectors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Content Selection
              </CardTitle>
              <CardDescription>
                Optionally limit monitoring to specific parts of the page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cssSelector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CSS Selector</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="#main-content, .article-body"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Only monitor elements matching this selector
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="textRegex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text Regex</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Price: \$[\d,.]+"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Only track text matching this pattern
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Ignore Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Ignore Patterns
              </CardTitle>
              <CardDescription>
                Exclude content matching these regex patterns from change detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="\d{4}-\d{2}-\d{2} (dates)"
                  value={ignoreRegexInput}
                  onChange={(e) => setIgnoreRegexInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIgnoreRegex();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addIgnoreRegex}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {(form.watch('ignoreRegexes')?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.watch('ignoreRegexes')?.map((regex, _i) => (
                    <Badge
                      key={_i}
                      variant="secondary"
                      className="gap-1 pr-1 font-mono text-xs"
                    >
                      {regex}
                      <button
                        type="button"
                        onClick={() => removeIgnoreRegex(regex)}
                        className="ml-1 hover:bg-muted rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Examples: timestamps, session IDs, random tokens
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditing ? `/targets/${targetId}` : '/targets')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? 'Save Changes' : 'Create Target'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
