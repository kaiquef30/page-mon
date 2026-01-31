import { z } from 'zod';

export const TargetModeSchema = z.enum(['TEXT', 'PLAYWRIGHT']);
export type TargetMode = z.infer<typeof TargetModeSchema>;

export const TargetStatusSchema = z.enum(['OK', 'ERROR', 'NEVER_RUN']);
export type TargetStatus = z.infer<typeof TargetStatusSchema>;

export const RunResultSchema = z.enum(['CHANGED', 'NO_CHANGE', 'SKIPPED', 'FAILED']);
export type RunResult = z.infer<typeof RunResultSchema>;

export const TargetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  enabled: z.boolean(),
  mode: TargetModeSchema,
  cssSelector: z.string().nullable().optional(),
  ignoreRegexes: z.array(z.string()).default([]),
  intervalMinutes: z.number().int().positive(),
  nextRun: z.string().datetime().nullable().optional(),
  lastRun: z.string().datetime().nullable().optional(),
  lastStatus: TargetStatusSchema.nullable().optional(),
  lastError: z.string().nullable().optional(),
});
export type Target = z.infer<typeof TargetSchema>;

export const CreateTargetSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  enabled: z.boolean().default(true),
  mode: TargetModeSchema.default('TEXT'),
  cssSelector: z.string().optional().or(z.literal('')),
  textRegex: z.string().optional().or(z.literal('')),
  ignoreRegexes: z.array(z.string()).default([]),
  intervalMinutes: z.number().int().positive().default(60),
});
export type CreateTarget = z.infer<typeof CreateTargetSchema>;

export type UpdateTarget = Partial<CreateTarget>;

export interface TargetQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  enabled?: boolean;
  status?: TargetStatus;
  mode?: TargetMode;
}

export const SnapshotSchema = z.object({
  id: z.string().uuid(),
  targetId: z.string().uuid(),
  fetchedAt: z.string().datetime(),
  httpStatus: z.number().int().nullable().optional(),
  etag: z.string().nullable().optional(),
  lastModified: z.string().nullable().optional(),
  hash: z.string(),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;

export const ChangeSchema = z.object({
  id: z.string().uuid(),
  targetId: z.string().uuid(),
  createdAt: z.string().datetime(),
  diff: z.string(),
  linesAdded: z.number().int().nonnegative(),
  linesRemoved: z.number().int().nonnegative(),
  targetName: z.string().optional(),
});
export type Change = z.infer<typeof ChangeSchema>;

export interface ChangeQueryParams {
  page?: number;
  size?: number;
  targetId?: string;
}

export const RunResponseSchema = z.object({
  result: RunResultSchema,
  message: z.string().optional(),
  changeId: z.string().uuid().nullable().optional(),
});
export type RunResponse = z.infer<typeof RunResponseSchema>;

export const DiscordNotificationSchema = z.object({
  enabled: z.boolean(),
  webhookUrlMasked: z.string().nullable().optional(),
  maxDiffChars: z.number().int().min(200).max(4000),
});
export type DiscordNotification = z.infer<typeof DiscordNotificationSchema>;

export const UpdateDiscordNotificationSchema = z.object({
  enabled: z.boolean(),
  webhookUrl: z.string().url().optional().or(z.literal('')).nullable(),
  maxDiffChars: z.number().int().min(200).max(4000),
});
export type UpdateDiscordNotification = z.infer<typeof UpdateDiscordNotificationSchema>;

export const ApiErrorSchema = z.object({
  message: z.string(),
  timestamp: z.string().optional(),
  error: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
