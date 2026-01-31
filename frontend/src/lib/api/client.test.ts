import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiRequestError } from './client';
import type {
  Target,
  CreateTarget,
  UpdateTarget,
  Change,
  Snapshot,
  RunResponse,
  DiscordNotification,
  UpdateDiscordNotification,
} from './types';

// Mock environment variables
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080');
vi.stubEnv('VITE_API_PREFIX', '/api/v1');

describe('ApiClient', () => {
  let client: ApiClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new ApiClient('http://localhost:8080');
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createMockResponse = (data: unknown, status = 200, ok = true) => ({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  });

  const createEmptyResponse = (status = 204, ok = true) => ({
    ok,
    status,
    statusText: ok ? 'No Content' : 'Error',
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
  });

  describe('constructor', () => {
    it('should create an instance with default base URL', () => {
      const defaultClient = new ApiClient();
      expect(defaultClient).toBeInstanceOf(ApiClient);
    });

    it('should create an instance with custom base URL', () => {
      const customClient = new ApiClient('http://custom.com');
      expect(customClient).toBeInstanceOf(ApiClient);
    });
  });

  describe('request method', () => {
    describe('success cases', () => {
      it('should make a successful GET request', async () => {
        const mockData = { id: '123', name: 'Test' };
        fetchMock.mockResolvedValue(createMockResponse(mockData));

        const result = await client['request']('/test');

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:8080/test',
          expect.objectContaining({
            signal: expect.any(AbortSignal),
          })
        );
        expect(result).toEqual(mockData);
      });

      it('should make a successful POST request with JSON body', async () => {
        const mockData = { id: '123' };
        const payload = { name: 'Test' };
        fetchMock.mockResolvedValue(createMockResponse(mockData));

        const result = await client['request']('/test', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:8080/test',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(payload),
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
        expect(result).toEqual(mockData);
      });

      it('should handle empty response bodies', async () => {
        fetchMock.mockResolvedValue(createEmptyResponse());

        const result = await client['request']('/test', { method: 'DELETE' });

        expect(result).toBeUndefined();
      });

      it('should not set Content-Type for GET requests', async () => {
        fetchMock.mockResolvedValue(createMockResponse({ data: 'test' }));

        await client['request']('/test', { method: 'GET' });

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:8080/test',
          expect.objectContaining({
            method: 'GET',
            headers: expect.not.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });

      it('should not override existing Content-Type header', async () => {
        fetchMock.mockResolvedValue(createMockResponse({ data: 'test' }));

        await client['request']('/test', {
          method: 'POST',
          body: 'test',
          headers: { 'Content-Type': 'text/plain' },
        });

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:8080/test',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'text/plain',
            }),
          })
        );
      });

      it('should not set Content-Type for FormData', async () => {
        const formData = new FormData();
        formData.append('file', 'test');
        fetchMock.mockResolvedValue(createMockResponse({ data: 'test' }));

        await client['request']('/test', {
          method: 'POST',
          body: formData,
        });

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:8080/test',
          expect.objectContaining({
            body: formData,
            headers: expect.not.objectContaining({
              'Content-Type': expect.any(String),
            }),
          })
        );
      });
    });

    describe('error handling', () => {
      it('should throw ApiRequestError on HTTP error with JSON response', async () => {
        const errorResponse = { message: 'Not Found', error: 'NotFoundError' };
        fetchMock.mockResolvedValue(createMockResponse(errorResponse, 404, false));

        await expect(client['request']('/test')).rejects.toThrow(ApiRequestError);
        await expect(client['request']('/test')).rejects.toThrow('Not Found');

        try {
          await client['request']('/test');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiRequestError);
          expect((error as ApiRequestError).status).toBe(404);
          expect((error as ApiRequestError).details).toEqual(errorResponse);
        }
      });

      it('should handle HTTP error without JSON response', async () => {
        const mockResponse = {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
          text: vi.fn().mockResolvedValue(''),
        };
        fetchMock.mockResolvedValue(mockResponse);

        await expect(client['request']('/test')).rejects.toThrow(ApiRequestError);
        await expect(client['request']('/test')).rejects.toThrow('HTTP 500: Internal Server Error');
      });

      it('should handle timeout', async () => {
        fetchMock.mockImplementation(() => new Promise(() => {})); // Never resolves

        const promise = client['request']('/test', { timeout: 1000 });

        // Advance timers to trigger timeout
        vi.advanceTimersByTime(1000);

        await expect(promise).rejects.toThrow(ApiRequestError);
        await expect(promise).rejects.toThrow('Request timeout');

        try {
          await promise;
        } catch (error) {
          expect((error as ApiRequestError).status).toBe(408);
        }
      });

      it('should use custom timeout value', async () => {
        fetchMock.mockImplementation(() => new Promise(() => {}));

        const promise = client['request']('/test', { timeout: 5000 });

        vi.advanceTimersByTime(4999);
        await vi.advanceTimersByTimeAsync(0); // Process pending microtasks

        vi.advanceTimersByTime(1);

        await expect(promise).rejects.toThrow('Request timeout');
      });

      it('should handle network errors', async () => {
        fetchMock.mockRejectedValue(new Error('Network failure'));

        await expect(client['request']('/test')).rejects.toThrow(ApiRequestError);
        await expect(client['request']('/test')).rejects.toThrow('Network failure');
      });

      it('should handle non-Error exceptions', async () => {
        fetchMock.mockRejectedValue('String error');

        await expect(client['request']('/test')).rejects.toThrow(ApiRequestError);
        await expect(client['request']('/test')).rejects.toThrow('Network error');
      });

      it('should clear timeout on successful request', async () => {
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        fetchMock.mockResolvedValue(createMockResponse({ data: 'test' }));

        await client['request']('/test');

        expect(clearTimeoutSpy).toHaveBeenCalled();
      });

      it('should clear timeout on failed request', async () => {
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        fetchMock.mockResolvedValue(createMockResponse({}, 500, false));

        await expect(client['request']('/test')).rejects.toThrow();

        expect(clearTimeoutSpy).toHaveBeenCalled();
      });
    });
  });

  describe('getTargets', () => {
    const mockApiTargets = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Target 1',
        url: 'https://example.com',
        enabled: true,
        fetchMode: 'JSOUP' as const,
        cssSelector: '.content',
        ignoreRegexes: ['regex1'],
        intervalSeconds: 3600,
        nextRunAt: '2026-01-29T12:00:00Z',
        lastRunAt: '2026-01-29T11:00:00Z',
        lastStatus: 'OK' as const,
        lastError: null,
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        name: 'Test Target 2',
        url: 'https://example2.com',
        enabled: false,
        fetchMode: 'PLAYWRIGHT' as const,
        cssSelector: null,
        ignoreRegexes: [],
        intervalSeconds: 7200,
        nextRunAt: null,
        lastRunAt: null,
        lastStatus: null,
        lastError: null,
      },
    ];

    it('should fetch and map targets', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockApiTargets));

      const result = await client.getTargets();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/targets',
        expect.any(Object)
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Target 1',
        url: 'https://example.com',
        enabled: true,
        mode: 'TEXT',
        cssSelector: '.content',
        ignoreRegexes: ['regex1'],
        intervalMinutes: 60,
        nextRun: '2026-01-29T12:00:00Z',
        lastRun: '2026-01-29T11:00:00Z',
        lastStatus: 'OK',
        lastError: null,
      });
      expect(result[1]).toEqual({
        id: '223e4567-e89b-12d3-a456-426614174000',
        name: 'Test Target 2',
        url: 'https://example2.com',
        enabled: false,
        mode: 'PLAYWRIGHT',
        cssSelector: null,
        ignoreRegexes: [],
        intervalMinutes: 120,
        nextRun: null,
        lastRun: null,
        lastStatus: 'NEVER_RUN',
        lastError: null,
      });
    });

    it('should filter by enabled status', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockApiTargets));

      const result = await client.getTargets({ enabled: true });

      expect(result).toHaveLength(1);
      expect(result[0].enabled).toBe(true);
    });

    it('should filter by mode', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockApiTargets));

      const result = await client.getTargets({ mode: 'PLAYWRIGHT' });

      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe('PLAYWRIGHT');
    });

    it('should filter by status', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockApiTargets));

      const result = await client.getTargets({ status: 'OK' });

      expect(result).toHaveLength(1);
      expect(result[0].lastStatus).toBe('OK');
    });

    it('should handle empty target list', async () => {
      fetchMock.mockResolvedValue(createMockResponse([]));

      const result = await client.getTargets();

      expect(result).toEqual([]);
    });

    it('should map intervalSeconds to intervalMinutes correctly', async () => {
      const target = {
        ...mockApiTargets[0],
        intervalSeconds: 90, // 1.5 minutes
      };
      fetchMock.mockResolvedValue(createMockResponse([target]));

      const result = await client.getTargets();

      expect(result[0].intervalMinutes).toBe(2); // Rounded up
    });

    it('should handle missing optional fields', async () => {
      const minimalTarget = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Minimal',
        url: 'https://example.com',
        enabled: true,
        fetchMode: 'JSOUP' as const,
        intervalSeconds: 3600,
      };
      fetchMock.mockResolvedValue(createMockResponse([minimalTarget]));

      const result = await client.getTargets();

      expect(result[0]).toMatchObject({
        cssSelector: null,
        ignoreRegexes: [],
        nextRun: null,
        lastRun: null,
        lastStatus: 'NEVER_RUN',
        lastError: null,
      });
    });
  });

  describe('getTarget', () => {
    const mockApiTarget = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Target',
      url: 'https://example.com',
      enabled: true,
      fetchMode: 'JSOUP' as const,
      cssSelector: '.content',
      ignoreRegexes: ['regex1'],
      intervalSeconds: 3600,
      nextRunAt: '2026-01-29T12:00:00Z',
      lastRunAt: '2026-01-29T11:00:00Z',
      lastStatus: 'OK' as const,
      lastError: null,
    };

    it('should fetch and map a single target', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockApiTarget));

      const result = await client.getTarget('123e4567-e89b-12d3-a456-426614174000');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/targets/123e4567-e89b-12d3-a456-426614174000',
        expect.any(Object)
      );
      expect(result).toMatchObject({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Target',
        url: 'https://example.com',
        mode: 'TEXT',
      });
    });

    it('should handle target not found', async () => {
      fetchMock.mockResolvedValue(createMockResponse({ message: 'Not found' }, 404, false));

      await expect(client.getTarget('invalid-id')).rejects.toThrow(ApiRequestError);
    });

    it('should map status ERROR correctly', async () => {
      const errorTarget = {
        ...mockApiTarget,
        lastStatus: 'FETCH_FAILED' as const,
        lastError: 'Connection timeout',
      };
      fetchMock.mockResolvedValue(createMockResponse(errorTarget));

      const result = await client.getTarget('123e4567-e89b-12d3-a456-426614174000');

      expect(result.lastStatus).toBe('ERROR');
      expect(result.lastError).toBe('Connection timeout');
    });
  });

  describe('createTarget', () => {
    const createData: CreateTarget = {
      name: 'New Target',
      url: 'https://example.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: '.content',
      ignoreRegexes: ['regex1', 'regex2'],
      intervalMinutes: 60,
    };

    const mockResponse = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'New Target',
      url: 'https://example.com',
      enabled: true,
      fetchMode: 'JSOUP' as const,
      cssSelector: '.content',
      ignoreRegexes: ['regex1', 'regex2'],
      intervalSeconds: 3600,
      nextRunAt: null,
      lastRunAt: null,
      lastStatus: null,
      lastError: null,
    };

    it('should create a target with all fields', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      const result = await client.createTarget(createData);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/targets',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'New Target',
            url: 'https://example.com',
            enabled: true,
            fetchMode: 'JSOUP',
            cssSelector: '.content',
            ignoreRegexes: ['regex1', 'regex2'],
            intervalSeconds: 3600,
          }),
        })
      );
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should convert PLAYWRIGHT mode correctly', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.createTarget({ ...createData, mode: 'PLAYWRIGHT' });

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.fetchMode).toBe('PLAYWRIGHT');
    });

    it('should convert empty cssSelector to null', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.createTarget({ ...createData, cssSelector: '  ' });

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.cssSelector).toBeNull();
    });

    it('should handle missing optional fields', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.createTarget({
        name: 'Minimal',
        url: 'https://example.com',
        enabled: true,
        mode: 'TEXT',
      });

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.cssSelector).toBeNull();
      expect(body.ignoreRegexes).toEqual([]);
      expect(body.intervalSeconds).toBeGreaterThanOrEqual(60);
    });

    it('should enforce minimum intervalSeconds of 60', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.createTarget({ ...createData, intervalMinutes: 0.5 }); // 30 seconds

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.intervalSeconds).toBe(60);
    });

    it('should convert intervalMinutes to intervalSeconds', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.createTarget({ ...createData, intervalMinutes: 120 });

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.intervalSeconds).toBe(7200);
    });
  });

  describe('updateTarget', () => {
    const targetId = '123e4567-e89b-12d3-a456-426614174000';
    const mockResponse = {
      id: targetId,
      name: 'Updated Target',
      url: 'https://example.com',
      enabled: false,
      fetchMode: 'PLAYWRIGHT' as const,
      cssSelector: '.new-content',
      ignoreRegexes: ['new-regex'],
      intervalSeconds: 7200,
      nextRunAt: null,
      lastRunAt: null,
      lastStatus: null,
      lastError: null,
    };

    it('should update all fields', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      const updateData: UpdateTarget = {
        name: 'Updated Target',
        enabled: false,
        mode: 'PLAYWRIGHT',
        cssSelector: '.new-content',
        ignoreRegexes: ['new-regex'],
        intervalMinutes: 120,
      };

      const result = await client.updateTarget(targetId, updateData);

      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:8080/api/v1/targets/${targetId}`,
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Updated Target'),
        })
      );
      expect(result.name).toBe('Updated Target');
    });

    it('should only include provided fields in payload', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.updateTarget(targetId, { enabled: false });

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body).toEqual({ enabled: false });
      expect(body.name).toBeUndefined();
      expect(body.url).toBeUndefined();
    });

    it('should convert empty cssSelector to null', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.updateTarget(targetId, { cssSelector: '' });

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.cssSelector).toBeNull();
    });

    it('should convert mode to fetchMode', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.updateTarget(targetId, { mode: 'PLAYWRIGHT' });

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.fetchMode).toBe('PLAYWRIGHT');
    });

    it('should convert intervalMinutes to intervalSeconds', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.updateTarget(targetId, { intervalMinutes: 90 });

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.intervalSeconds).toBe(5400);
    });

    it('should enforce minimum intervalSeconds of 60', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockResponse));

      await client.updateTarget(targetId, { intervalMinutes: 0.5 });

      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.intervalSeconds).toBe(60);
    });
  });

  describe('deleteTarget', () => {
    it('should delete a target', async () => {
      fetchMock.mockResolvedValue(createEmptyResponse(204));

      const result = await client.deleteTarget('123e4567-e89b-12d3-a456-426614174000');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/targets/123e4567-e89b-12d3-a456-426614174000',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toBeUndefined();
    });

    it('should handle delete errors', async () => {
      fetchMock.mockResolvedValue(createMockResponse({ message: 'Not found' }, 404, false));

      await expect(client.deleteTarget('invalid-id')).rejects.toThrow(ApiRequestError);
    });
  });

  describe('runTarget', () => {
    const targetId = '123e4567-e89b-12d3-a456-426614174000';

    it('should run target without force', async () => {
      const mockRunResult = {
        status: 'CHANGED' as const,
        message: 'Changes detected',
        changeEventId: '456e4567-e89b-12d3-a456-426614174000',
      };
      fetchMock.mockResolvedValue(createMockResponse(mockRunResult));

      const result = await client.runTarget(targetId);

      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:8080/api/v1/targets/${targetId}/run?force=false`,
        expect.objectContaining({
          method: 'POST',
          timeout: 60000,
        })
      );
      expect(result).toEqual({
        result: 'CHANGED',
        message: 'Changes detected',
        changeId: '456e4567-e89b-12d3-a456-426614174000',
      });
    });

    it('should run target with force=true', async () => {
      const mockRunResult = {
        status: 'NO_CHANGE' as const,
        message: null,
        changeEventId: null,
      };
      fetchMock.mockResolvedValue(createMockResponse(mockRunResult));

      const result = await client.runTarget(targetId, true);

      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:8080/api/v1/targets/${targetId}/run?force=true`,
        expect.any(Object)
      );
      expect(result).toEqual({
        result: 'NO_CHANGE',
        message: undefined,
        changeId: null,
      });
    });

    it('should use extended timeout for run requests', async () => {
      const mockRunResult = { status: 'NO_CHANGE' as const };
      fetchMock.mockResolvedValue(createMockResponse(mockRunResult));

      await client.runTarget(targetId);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 60000 })
      );
    });

    it('should handle run failures', async () => {
      const mockRunResult = {
        status: 'FAILED' as const,
        message: 'Connection refused',
        changeEventId: null,
      };
      fetchMock.mockResolvedValue(createMockResponse(mockRunResult));

      const result = await client.runTarget(targetId);

      expect(result.result).toBe('FAILED');
      expect(result.message).toBe('Connection refused');
    });

    it('should handle skipped runs', async () => {
      const mockRunResult = {
        status: 'SKIPPED' as const,
        message: 'Too soon',
        changeEventId: null,
      };
      fetchMock.mockResolvedValue(createMockResponse(mockRunResult));

      const result = await client.runTarget(targetId);

      expect(result.result).toBe('SKIPPED');
    });
  });

  describe('getSnapshots', () => {
    const targetId = '123e4567-e89b-12d3-a456-426614174000';
    const mockSnapshots = [
      {
        id: 'snap-1',
        targetId,
        fetchedAt: '2026-01-29T12:00:00Z',
        httpStatus: 200,
        etag: 'abc123',
        lastModified: '2026-01-29T11:00:00Z',
        contentHashSha256: 'hash123',
      },
      {
        id: 'snap-2',
        targetId,
        fetchedAt: '2026-01-29T11:00:00Z',
        httpStatus: null,
        etag: null,
        lastModified: null,
        contentHashSha256: 'hash456',
      },
    ];

    it('should fetch snapshots with default limit', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockSnapshots));

      const result = await client.getSnapshots(targetId);

      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:8080/api/v1/targets/${targetId}/snapshots?limit=20`,
        expect.any(Object)
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'snap-1',
        targetId,
        fetchedAt: '2026-01-29T12:00:00Z',
        httpStatus: 200,
        etag: 'abc123',
        lastModified: '2026-01-29T11:00:00Z',
        hash: 'hash123',
      });
    });

    it('should fetch snapshots with custom limit', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockSnapshots));

      await client.getSnapshots(targetId, 50);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });

    it('should enforce maximum limit of 200', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockSnapshots));

      await client.getSnapshots(targetId, 500);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=200'),
        expect.any(Object)
      );
    });

    it('should enforce minimum limit of 1', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockSnapshots));

      await client.getSnapshots(targetId, 0);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=1'),
        expect.any(Object)
      );
    });

    it('should handle empty snapshot list', async () => {
      fetchMock.mockResolvedValue(createMockResponse([]));

      const result = await client.getSnapshots(targetId);

      expect(result).toEqual([]);
    });

    it('should map null optional fields correctly', async () => {
      fetchMock.mockResolvedValue(createMockResponse([mockSnapshots[1]]));

      const result = await client.getSnapshots(targetId);

      expect(result[0].httpStatus).toBeNull();
      expect(result[0].etag).toBeNull();
      expect(result[0].lastModified).toBeNull();
    });
  });

  describe('getChanges', () => {
    const mockChanges = [
      {
        id: 'change-1',
        targetId: 'target-1',
        createdAt: '2026-01-29T12:00:00Z',
        oldSnapshotId: 'snap-1',
        newSnapshotId: 'snap-2',
        addedLines: 10,
        removedLines: 5,
        unifiedDiff: '+++ added\n--- removed',
      },
    ];

    it('should fetch changes with default parameters', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockChanges));

      const result = await client.getChanges();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/changes?limit=20',
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'change-1',
        targetId: 'target-1',
        createdAt: '2026-01-29T12:00:00Z',
        diff: '+++ added\n--- removed',
        linesAdded: 10,
        linesRemoved: 5,
      });
    });

    it('should fetch changes with custom size', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockChanges));

      await client.getChanges({ size: 50 });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });

    it('should filter by targetId', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockChanges));

      await client.getChanges({ targetId: 'target-1' });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('targetId=target-1'),
        expect.any(Object)
      );
    });

    it('should enforce maximum limit of 200', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockChanges));

      await client.getChanges({ size: 500 });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=200'),
        expect.any(Object)
      );
    });

    it('should enforce minimum limit of 1', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockChanges));

      await client.getChanges({ size: -10 });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=1'),
        expect.any(Object)
      );
    });
  });

  describe('getChange', () => {
    const mockChange = {
      id: 'change-1',
      targetId: 'target-1',
      createdAt: '2026-01-29T12:00:00Z',
      oldSnapshotId: 'snap-1',
      newSnapshotId: 'snap-2',
      addedLines: 10,
      removedLines: 5,
      unifiedDiff: '+++ added\n--- removed',
    };

    it('should fetch a single change', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockChange));

      const result = await client.getChange('change-1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/changes/change-1',
        expect.any(Object)
      );
      expect(result).toEqual({
        id: 'change-1',
        targetId: 'target-1',
        createdAt: '2026-01-29T12:00:00Z',
        diff: '+++ added\n--- removed',
        linesAdded: 10,
        linesRemoved: 5,
      });
    });

    it('should handle change not found', async () => {
      fetchMock.mockResolvedValue(createMockResponse({ message: 'Not found' }, 404, false));

      await expect(client.getChange('invalid-id')).rejects.toThrow(ApiRequestError);
    });
  });

  describe('getTargetChanges', () => {
    const targetId = 'target-1';
    const mockChanges = [
      {
        id: 'change-1',
        targetId,
        createdAt: '2026-01-29T12:00:00Z',
        oldSnapshotId: 'snap-1',
        newSnapshotId: 'snap-2',
        addedLines: 10,
        removedLines: 5,
        unifiedDiff: '+++ added',
      },
    ];

    it('should fetch changes for a specific target', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockChanges));

      const result = await client.getTargetChanges(targetId);

      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:8080/api/v1/targets/${targetId}/changes?limit=20`,
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
    });

    it('should fetch target changes with custom limit', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockChanges));

      await client.getTargetChanges(targetId, 50);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });

    it('should enforce limit bounds', async () => {
      fetchMock.mockResolvedValue(createMockResponse(mockChanges));

      await client.getTargetChanges(targetId, 500);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('limit=200'), expect.any(Object));

      await client.getTargetChanges(targetId, -10);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('limit=1'), expect.any(Object));
    });
  });

  describe('Discord Notifications', () => {
    describe('getDiscordNotification', () => {
      it('should fetch Discord notification config', async () => {
        const mockConfig = {
          enabled: true,
          webhookUrlMasked: 'https://discord.com/api/webhooks/***',
          maxDiffChars: 1000,
        };
        fetchMock.mockResolvedValue(createMockResponse(mockConfig));

        const result = await client.getDiscordNotification();

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:8080/api/v1/notifications/discord',
          expect.any(Object)
        );
        expect(result).toEqual(mockConfig);
      });
    });

    describe('updateDiscordNotification', () => {
      const mockResponse = {
        enabled: true,
        webhookUrlMasked: 'https://discord.com/api/webhooks/***',
        maxDiffChars: 2000,
      };

      it('should update Discord notification config', async () => {
        fetchMock.mockResolvedValue(createMockResponse(mockResponse));

        const updateData: UpdateDiscordNotification = {
          enabled: true,
          webhookUrl: 'https://discord.com/api/webhooks/123/abc',
          maxDiffChars: 2000,
        };

        const result = await client.updateDiscordNotification(updateData);

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:8080/api/v1/notifications/discord',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({
              enabled: true,
              webhookUrl: 'https://discord.com/api/webhooks/123/abc',
              maxDiffChars: 2000,
            }),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should convert empty webhookUrl to null', async () => {
        fetchMock.mockResolvedValue(createMockResponse(mockResponse));

        await client.updateDiscordNotification({
          enabled: false,
          webhookUrl: '  ',
          maxDiffChars: 1000,
        });

        const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
        const body = JSON.parse(callArgs.body as string);
        expect(body.webhookUrl).toBeNull();
      });
    });

    describe('deleteDiscordNotification', () => {
      it('should delete Discord notification config', async () => {
        fetchMock.mockResolvedValue(createEmptyResponse(204));

        const result = await client.deleteDiscordNotification();

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:8080/api/v1/notifications/discord',
          expect.objectContaining({ method: 'DELETE' })
        );
        expect(result).toBeUndefined();
      });
    });

    describe('testDiscordNotification', () => {
      it('should send a test notification', async () => {
        fetchMock.mockResolvedValue(createEmptyResponse(200));

        const result = await client.testDiscordNotification();

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:8080/api/v1/notifications/discord/test',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ message: 'Teste de notificação via UI' }),
          })
        );
        expect(result).toEqual({
          success: true,
          message: 'Mensagem enviada para o Discord.',
        });
      });
    });
  });

  describe('checkHealth', () => {
    it('should check API health and return latency', async () => {
      const mockHealth = { status: 'UP' };
      fetchMock.mockResolvedValue(createMockResponse(mockHealth));

      const result = await client.checkHealth();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/actuator/health',
        expect.any(Object)
      );
      expect(result.status).toBe('UP');
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(typeof result.latency).toBe('number');
    });

    it('should return DOWN status on error', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await client.checkHealth();

      expect(result.status).toBe('DOWN');
      expect(typeof result.latency).toBe('number');
    });

    it('should measure latency correctly', async () => {
      const mockHealth = { status: 'UP' };
      let resolvePromise: (value: unknown) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValue(delayedPromise);

      const healthPromise = client.checkHealth();

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      resolvePromise!(createMockResponse(mockHealth));

      const result = await healthPromise;

      expect(result.latency).toBeGreaterThan(0);
    });
  });

  describe('ApiRequestError', () => {
    it('should create error with all properties', () => {
      const details = { message: 'Error details', timestamp: '2026-01-29T12:00:00Z' };
      const error = new ApiRequestError('Test error', 400, details);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.details).toEqual(details);
      expect(error.name).toBe('ApiRequestError');
    });

    it('should create error without details', () => {
      const error = new ApiRequestError('Test error', 500);

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.details).toBeUndefined();
    });
  });

  describe('Mapper Functions', () => {
    describe('mapTarget', () => {
      it('should map PLAYWRIGHT mode correctly', async () => {
        const target = {
          id: '123',
          name: 'Test',
          url: 'https://example.com',
          enabled: true,
          fetchMode: 'PLAYWRIGHT' as const,
          intervalSeconds: 3600,
        };
        fetchMock.mockResolvedValue(createMockResponse([target]));

        const result = await client.getTargets();

        expect(result[0].mode).toBe('PLAYWRIGHT');
      });

      it('should map AUTO mode to TEXT', async () => {
        const target = {
          id: '123',
          name: 'Test',
          url: 'https://example.com',
          enabled: true,
          fetchMode: 'AUTO' as const,
          intervalSeconds: 3600,
        };
        fetchMock.mockResolvedValue(createMockResponse([target]));

        const result = await client.getTargets();

        expect(result[0].mode).toBe('TEXT');
      });

      it('should map all error statuses to ERROR', async () => {
        const statuses = ['FETCH_FAILED', 'EXTRACT_FAILED', 'STORE_FAILED'] as const;

        for (const status of statuses) {
          const target = {
            id: '123',
            name: 'Test',
            url: 'https://example.com',
            enabled: true,
            fetchMode: 'JSOUP' as const,
            intervalSeconds: 3600,
            lastRunAt: '2026-01-29T12:00:00Z',
            lastStatus: status,
          };
          fetchMock.mockResolvedValue(createMockResponse([target]));

          const result = await client.getTargets();
          expect(result[0].lastStatus).toBe('ERROR');
        }
      });

      it('should handle null ignoreRegexes', async () => {
        const target = {
          id: '123',
          name: 'Test',
          url: 'https://example.com',
          enabled: true,
          fetchMode: 'JSOUP' as const,
          intervalSeconds: 3600,
          ignoreRegexes: null as unknown as string[],
        };
        fetchMock.mockResolvedValue(createMockResponse([target]));

        const result = await client.getTargets();

        expect(result[0].ignoreRegexes).toEqual([]);
      });

      it('should ensure minimum intervalMinutes of 1', async () => {
        const target = {
          id: '123',
          name: 'Test',
          url: 'https://example.com',
          enabled: true,
          fetchMode: 'JSOUP' as const,
          intervalSeconds: 30, // Less than 1 minute
        };
        fetchMock.mockResolvedValue(createMockResponse([target]));

        const result = await client.getTargets();

        expect(result[0].intervalMinutes).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large responses', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `id-${i}`,
        name: `Target ${i}`,
        url: 'https://example.com',
        enabled: true,
        fetchMode: 'JSOUP' as const,
        intervalSeconds: 3600,
      }));
      fetchMock.mockResolvedValue(createMockResponse(largeArray));

      const result = await client.getTargets();

      expect(result).toHaveLength(1000);
    });

    it('should handle special characters in URLs', async () => {
      const targetId = '123e4567-e89b-12d3-a456-426614174000';
      fetchMock.mockResolvedValue(createEmptyResponse());

      await client.getSnapshots(targetId);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(targetId)),
        expect.any(Object)
      );
    });

    it('should handle concurrent requests', async () => {
      fetchMock.mockResolvedValue(createMockResponse([]));

      const promises = [
        client.getTargets(),
        client.getChanges(),
        client.checkHealth(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should handle response with unexpected fields', async () => {
      const targetWithExtra = {
        id: '123',
        name: 'Test',
        url: 'https://example.com',
        enabled: true,
        fetchMode: 'JSOUP' as const,
        intervalSeconds: 3600,
        unexpectedField: 'should be ignored',
        anotherField: 123,
      };
      fetchMock.mockResolvedValue(createMockResponse([targetWithExtra]));

      const result = await client.getTargets();

      expect(result[0]).not.toHaveProperty('unexpectedField');
      expect(result[0]).not.toHaveProperty('anotherField');
    });
  });
});
