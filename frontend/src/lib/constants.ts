
// Target status enum
export const TARGET_STATUS = {
  NEVER_RUN: 'NEVER_RUN',
  OK: 'OK',
  ERROR: 'ERROR',
  CHANGED: 'CHANGED',
  RUNNING: 'RUNNING',
} as const;

export type TargetStatus = typeof TARGET_STATUS[keyof typeof TARGET_STATUS];

// Target mode enum
export const TARGET_MODE = {
  TEXT: 'TEXT',
  HTML: 'HTML',
  JSON: 'JSON',
} as const;

export type TargetMode = typeof TARGET_MODE[keyof typeof TARGET_MODE];

// Run result enum
export const RUN_RESULT = {
  OK: 'OK',
  ERROR: 'ERROR',
  CHANGED: 'CHANGED',
} as const;

export type RunResult = typeof RUN_RESULT[keyof typeof RUN_RESULT];

// Interval presets (in seconds)
export const INTERVAL_PRESETS = {
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  SIX_HOURS: 21600,
  TWELVE_HOURS: 43200,
  TWENTY_FOUR_HOURS: 86400,
} as const;

// Status color mappings
export const STATUS_COLORS = {
  [TARGET_STATUS.NEVER_RUN]: 'default',
  [TARGET_STATUS.OK]: 'success',
  [TARGET_STATUS.ERROR]: 'destructive',
  [TARGET_STATUS.CHANGED]: 'warning',
  [TARGET_STATUS.RUNNING]: 'secondary',
} as const;

// API defaults
export const API_DEFAULTS = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  REQUEST_LIMIT: 100,
} as const;

// Discord notification limits
export const DISCORD_LIMITS = {
  MIN_DIFF_CHARS: 100,
  MAX_DIFF_CHARS: 10000,
  DEFAULT_DIFF_CHARS: 2000,
  MESSAGE_LIMIT: 2000, // Discord's message length limit
} as const;

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  COUNTDOWN: 1000, // Update countdown every second
  TARGETS_REFRESH: 30000, // Refresh targets list every 30s
  TARGET_DETAIL_REFRESH: 10000, // Refresh target detail every 10s
} as const;

// LocalStorage keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebar-state',
  VIEW_PREFERENCE: 'view-preference',
} as const;
