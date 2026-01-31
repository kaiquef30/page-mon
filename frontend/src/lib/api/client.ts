import type {
  Target,
  CreateTarget,
  UpdateTarget,
  Change,
  Snapshot,
  RunResponse,
  DiscordNotification,
  UpdateDiscordNotification,
  ApiError,
  TargetQueryParams,
  ChangeQueryParams,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';
const DEFAULT_TIMEOUT = 30000;
const RUN_TIMEOUT = 60000;

type ApiTarget = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  fetchMode: 'AUTO' | 'JSOUP' | 'PLAYWRIGHT';
  cssSelector?: string | null;
  ignoreRegexes?: string[];
  intervalSeconds: number;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  lastStatus?: 'OK' | 'FETCH_FAILED' | 'EXTRACT_FAILED' | 'STORE_FAILED' | null;
  lastError?: string | null;
};

type ApiSnapshot = {
  id: string;
  targetId: string;
  fetchedAt: string;
  httpStatus?: number | null;
  etag?: string | null;
  lastModified?: string | null;
  contentHashSha256: string;
};

type ApiChange = {
  id: string;
  targetId: string;
  createdAt: string;
  oldSnapshotId?: string | null;
  newSnapshotId?: string | null;
  addedLines: number;
  removedLines: number;
  unifiedDiff: string;
};

type ApiRunResult = {
  status: 'CHANGED' | 'NO_CHANGE' | 'SKIPPED' | 'FAILED';
  message?: string | null;
  changeEventId?: string | null;
};

type ApiDiscordConfig = {
  enabled: boolean;
  webhookUrlMasked?: string | null;
  maxDiffChars: number;
};

const toFetchMode = (mode: Target['mode']): ApiTarget['fetchMode'] => (mode === 'PLAYWRIGHT' ? 'PLAYWRIGHT' : 'JSOUP');

const mapTarget = (t: ApiTarget): Target => {
  const intervalMinutes = Math.max(1, Math.round((t.intervalSeconds ?? 3600) / 60));
  const lastRun = t.lastRunAt ?? null;
  const nextRun = t.nextRunAt ?? null;
  const status = !lastRun ? 'NEVER_RUN' : (t.lastStatus === 'OK' ? 'OK' : 'ERROR');

  return {
    id: t.id,
    name: t.name,
    url: t.url,
    enabled: t.enabled,
    mode: t.fetchMode === 'PLAYWRIGHT' ? 'PLAYWRIGHT' : 'TEXT',
    cssSelector: t.cssSelector ?? null,
    ignoreRegexes: Array.isArray(t.ignoreRegexes) ? t.ignoreRegexes : [],
    intervalMinutes,
    nextRun,
    lastRun,
    lastStatus: status,
    lastError: t.lastError ?? null,
  };
};

const mapSnapshot = (s: ApiSnapshot): Snapshot => ({
  id: s.id,
  targetId: s.targetId,
  fetchedAt: s.fetchedAt,
  httpStatus: s.httpStatus ?? null,
  etag: s.etag ?? null,
  lastModified: s.lastModified ?? null,
  hash: s.contentHashSha256,
});

const mapChange = (c: ApiChange): Change => ({
  id: c.id,
  targetId: c.targetId,
  createdAt: c.createdAt,
  diff: c.unifiedDiff,
  linesAdded: c.addedLines,
  linesRemoved: c.removedLines,
});

const mapRunResult = (r: ApiRunResult): RunResponse => ({
  result: r.status,
  message: r.message ?? undefined,
  changeId: r.changeEventId ?? null,
});

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string> | undefined),
    };

    const method = (fetchOptions.method ?? 'GET').toUpperCase();

    const isFormData =
      typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

    const hasBody =
      fetchOptions.body !== undefined && fetchOptions.body !== null;

    if (method !== 'GET' && hasBody && !isFormData && headers['Content-Type'] == null) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new ApiRequestError(error.message, response.status, error);
      }

      const text = await response.text();
      if (!text) return undefined as unknown as T;
      return JSON.parse(text) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiRequestError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiRequestError('Request timeout', 408);
      }
      throw new ApiRequestError(error instanceof Error ? error.message : 'Network error', 0);
    }
  }

  async getTargets(params?: TargetQueryParams): Promise<Target[]> {
    const list = await this.request<ApiTarget[]>(`${API_PREFIX}/targets`);
    let mapped = list.map(mapTarget);

    // Client-side filtering (backend list endpoint does not implement these params)
    if (params?.enabled !== undefined) mapped = mapped.filter((t) => t.enabled === params.enabled);
    if (params?.mode) mapped = mapped.filter((t) => t.mode === params.mode);
    if (params?.status) mapped = mapped.filter((t) => (t.lastStatus ?? 'NEVER_RUN') === params.status);

    return mapped;
  }

    async getTarget(id: string): Promise<Target> {
    const t = await this.request<ApiTarget>(`${API_PREFIX}/targets/${id}`);
    return mapTarget(t);
  }

    async createTarget(data: CreateTarget): Promise<Target> {
    const payload = {
      name: data.name,
      url: data.url,
      enabled: data.enabled,
      fetchMode: toFetchMode(data.mode),
      cssSelector: data.cssSelector && data.cssSelector.trim() ? data.cssSelector : null,
      ignoreRegexes: data.ignoreRegexes ?? [],
      intervalSeconds: Math.max(60, Math.round((data.intervalMinutes ?? 60) * 60)),
    };

    const t = await this.request<ApiTarget>(`${API_PREFIX}/targets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapTarget(t);
  }

    async updateTarget(id: string, data: UpdateTarget): Promise<Target> {
    const payload: Record<string, unknown> = {};

    if (data.name !== undefined) payload.name = data.name;
    if (data.url !== undefined) payload.url = data.url;
    if (data.enabled !== undefined) payload.enabled = data.enabled;
    if (data.mode !== undefined) payload.fetchMode = toFetchMode(data.mode);
    if (data.cssSelector !== undefined) payload.cssSelector = data.cssSelector && data.cssSelector.trim() ? data.cssSelector : null;
    if (data.ignoreRegexes !== undefined) payload.ignoreRegexes = data.ignoreRegexes;
    if (data.intervalMinutes !== undefined) payload.intervalSeconds = Math.max(60, Math.round(data.intervalMinutes * 60));

    const t = await this.request<ApiTarget>(`${API_PREFIX}/targets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapTarget(t);
  }

    async deleteTarget(id: string): Promise<void> {
    return this.request<void>(`${API_PREFIX}/targets/${id}`, { method: 'DELETE' });
  }

    async runTarget(id: string, force: boolean = false): Promise<RunResponse> {
    const r = await this.request<ApiRunResult>(`${API_PREFIX}/targets/${id}/run?force=${force}`, {
      method: 'POST',
      timeout: RUN_TIMEOUT,
    });
    return mapRunResult(r);
  }


    async getSnapshots(targetId: string, limit: number = 20): Promise<Snapshot[]> {
    const list = await this.request<ApiSnapshot[]>(`${API_PREFIX}/targets/${targetId}/snapshots?limit=${Math.max(1, Math.min(limit, 200))}`);
    return list.map(mapSnapshot);
  }


    async getChanges(params?: ChangeQueryParams): Promise<Change[]> {
    const limit = Math.max(1, Math.min(params?.size ?? 20, 200));
    const searchParams = new URLSearchParams();
    searchParams.set('limit', String(limit));
    if (params?.targetId) searchParams.set('targetId', params.targetId);

    const list = await this.request<ApiChange[]>(`${API_PREFIX}/changes?${searchParams.toString()}`);
    return list.map(mapChange);
  }

    async getChange(id: string): Promise<Change> {
    const c = await this.request<ApiChange>(`${API_PREFIX}/changes/${id}`);
    return mapChange(c);
  }

    async getTargetChanges(targetId: string, limit: number = 20): Promise<Change[]> {
    const list = await this.request<ApiChange[]>(`${API_PREFIX}/targets/${targetId}/changes?limit=${Math.max(1, Math.min(limit, 200))}`);
    return list.map(mapChange);
  }


    async getDiscordNotification(): Promise<DiscordNotification> {
    return this.request<ApiDiscordConfig>(`${API_PREFIX}/notifications/discord`).then((c) => c as DiscordNotification);
  }

    async updateDiscordNotification(data: UpdateDiscordNotification): Promise<DiscordNotification> {
    const payload = {
      enabled: data.enabled,
      webhookUrl: data.webhookUrl && data.webhookUrl.trim() ? data.webhookUrl : null,
      maxDiffChars: data.maxDiffChars,
    };
    return this.request<ApiDiscordConfig>(`${API_PREFIX}/notifications/discord`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((c) => c as DiscordNotification);
  }

    async deleteDiscordNotification(): Promise<void> {
    return this.request<void>(`${API_PREFIX}/notifications/discord`, { method: 'DELETE' });
  }

    async testDiscordNotification(): Promise<{ success: boolean; message: string }> {
    await this.request<void>(`${API_PREFIX}/notifications/discord/test`, {
      method: 'POST',
      body: JSON.stringify({ message: 'Teste de notificação via UI' }),
    });
    return { success: true, message: 'Mensagem enviada para o Discord.' };
  }


    async checkHealth(): Promise<{ status: string; latency?: number }> {
    const start = performance.now();
    const result = await this.request<{ status: string }>(`/actuator/health`).catch(() => ({ status: 'DOWN' }));
    const latency = Math.round(performance.now() - start);
    return { ...result, latency };
  }
}

export class ApiRequestError extends Error {
    constructor(
    message: string,
    public status: number,
    public details?: ApiError
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const api = new ApiClient();

export { ApiClient, API_BASE_URL, API_PREFIX };
