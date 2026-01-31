import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useTargets,
  useTarget,
  useChanges,
  useCreateTarget,
  useUpdateTarget,
  useDeleteTarget,
  useRunTarget,
  queryKeys,
} from './queries';
import { api } from './client';
import type { Target, CreateTarget, UpdateTarget, RunResponse } from './types';

// Mock the API client
vi.mock('./client', () => ({
  api: {
    getTargets: vi.fn(),
    getTarget: vi.fn(),
    getChanges: vi.fn(),
    createTarget: vi.fn(),
    updateTarget: vi.fn(),
    deleteTarget: vi.fn(),
    runTarget: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useTargets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch targets successfully', async () => {
    const mockTargets: Target[] = [
      {
        id: '1',
        name: 'Test Target',
        url: 'https://example.com',
        enabled: true,
        mode: 'TEXT',
        cssSelector: null,
        ignoreRegexes: [],
        intervalMinutes: 60,
        nextRun: null,
        lastRun: null,
        lastStatus: 'NEVER_RUN',
        lastError: null,
      },
    ];

    vi.mocked(api.getTargets).mockResolvedValue(mockTargets);

    const { result } = renderHook(() => useTargets(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTargets);
    expect(api.getTargets).toHaveBeenCalledWith(undefined);
  });

  it('should handle fetch error', async () => {
    const error = new Error('Network error');
    vi.mocked(api.getTargets).mockRejectedValue(error);

    const { result } = renderHook(() => useTargets(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should pass query parameters to API', async () => {
    vi.mocked(api.getTargets).mockResolvedValue([]);

    const params = { enabled: true, mode: 'TEXT' as const };
    const { result } = renderHook(() => useTargets(params), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.getTargets).toHaveBeenCalledWith(params);
  });

  it('should return empty array by default', async () => {
    vi.mocked(api.getTargets).mockResolvedValue([]);

    const { result } = renderHook(() => useTargets(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch target by id', async () => {
    const mockTarget: Target = {
      id: '1',
      name: 'Test Target',
      url: 'https://example.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: null,
      ignoreRegexes: [],
      intervalMinutes: 60,
      nextRun: null,
      lastRun: null,
      lastStatus: 'OK',
      lastError: null,
    };

    vi.mocked(api.getTarget).mockResolvedValue(mockTarget);

    const { result } = renderHook(() => useTarget('1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTarget);
    expect(api.getTarget).toHaveBeenCalledWith('1');
  });

  it('should handle 404 error', async () => {
    const error = new Error('Target not found');
    vi.mocked(api.getTarget).mockRejectedValue(error);

    const { result } = renderHook(() => useTarget('invalid-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should not fetch when id is empty', async () => {
    const { result } = renderHook(() => useTarget(''), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });

    expect(api.getTarget).not.toHaveBeenCalled();
  });
});

describe('useChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch changes successfully', async () => {
    const mockChanges = [
      {
        id: '1',
        targetId: 'target-1',
        createdAt: '2024-01-01T00:00:00Z',
        diff: 'diff content',
        linesAdded: 5,
        linesRemoved: 2,
      },
    ];

    vi.mocked(api.getChanges).mockResolvedValue(mockChanges);

    const { result } = renderHook(() => useChanges(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockChanges);
    expect(api.getChanges).toHaveBeenCalledWith(undefined);
  });

  it('should pass query parameters', async () => {
    vi.mocked(api.getChanges).mockResolvedValue([]);

    const params = { size: 10, targetId: 'target-1' };
    const { result } = renderHook(() => useChanges(params), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.getChanges).toHaveBeenCalledWith(params);
  });
});

describe('useCreateTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create target and invalidate queries', async () => {
    const newTarget: Target = {
      id: 'new-id',
      name: 'New Target',
      url: 'https://new-target.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: null,
      ignoreRegexes: [],
      intervalMinutes: 60,
      nextRun: null,
      lastRun: null,
      lastStatus: 'NEVER_RUN',
      lastError: null,
    };

    vi.mocked(api.createTarget).mockResolvedValue(newTarget);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateTarget(), { wrapper });

    const createData: CreateTarget = {
      name: 'New Target',
      url: 'https://new-target.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: '',
      ignoreRegexes: [],
      intervalMinutes: 60,
    };

    result.current.mutate(createData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.createTarget).toHaveBeenCalledWith(createData);
    expect(result.current.data).toEqual(newTarget);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.all });
  });

  it('should handle creation error', async () => {
    const error = new Error('Validation failed');
    vi.mocked(api.createTarget).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateTarget(), { wrapper: createWrapper() });

    const createData: CreateTarget = {
      name: 'Invalid',
      url: 'not-a-url',
      enabled: true,
      mode: 'TEXT',
      cssSelector: '',
      ignoreRegexes: [],
      intervalMinutes: 60,
    };

    result.current.mutate(createData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useUpdateTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update target and invalidate queries', async () => {
    const updatedTarget: Target = {
      id: '1',
      name: 'Updated Target',
      url: 'https://example.com',
      enabled: false,
      mode: 'TEXT',
      cssSelector: null,
      ignoreRegexes: [],
      intervalMinutes: 60,
      nextRun: null,
      lastRun: null,
      lastStatus: 'OK',
      lastError: null,
    };

    vi.mocked(api.updateTarget).mockResolvedValue(updatedTarget);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateTarget(), { wrapper });

    const updateData: UpdateTarget = { enabled: false };

    result.current.mutate({ id: '1', data: updateData });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.updateTarget).toHaveBeenCalledWith('1', updateData);
    expect(result.current.data).toEqual(updatedTarget);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.detail('1') });
  });

  it('should handle update error', async () => {
    const error = new Error('Update failed');
    vi.mocked(api.updateTarget).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateTarget(), { wrapper: createWrapper() });

    result.current.mutate({ id: '1', data: { name: 'New Name' } });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useDeleteTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete target and invalidate queries', async () => {
    vi.mocked(api.deleteTarget).mockResolvedValue(undefined);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteTarget(), { wrapper });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.deleteTarget).toHaveBeenCalledWith('1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.all });
  });

  it('should handle delete error', async () => {
    const error = new Error('Delete failed');
    vi.mocked(api.deleteTarget).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteTarget(), { wrapper: createWrapper() });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useRunTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run target and invalidate queries', async () => {
    const runResponse: RunResponse = {
      result: 'CHANGED',
      message: 'Changes detected',
      changeId: 'change-1',
    };

    vi.mocked(api.runTarget).mockResolvedValue(runResponse);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRunTarget(), { wrapper });

    result.current.mutate({ id: '1', force: false });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.runTarget).toHaveBeenCalledWith('1', false);
    expect(result.current.data).toEqual(runResponse);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.detail('1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.changes('1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.changes.all });
  });

  it('should support force run', async () => {
    const runResponse: RunResponse = {
      result: 'NO_CHANGE',
      message: 'No changes',
      changeId: null,
    };

    vi.mocked(api.runTarget).mockResolvedValue(runResponse);

    const { result } = renderHook(() => useRunTarget(), { wrapper: createWrapper() });

    result.current.mutate({ id: '1', force: true });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.runTarget).toHaveBeenCalledWith('1', true);
  });

  it('should handle run failure', async () => {
    const error = new Error('Run failed');
    vi.mocked(api.runTarget).mockRejectedValue(error);

    const { result } = renderHook(() => useRunTarget(), { wrapper: createWrapper() });

    result.current.mutate({ id: '1' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should return different run results', async () => {
    const results: RunResponse[] = [
      { result: 'CHANGED', changeId: 'change-1' },
      { result: 'NO_CHANGE', changeId: null },
      { result: 'SKIPPED', changeId: null },
      { result: 'FAILED', message: 'Error message', changeId: null },
    ];

    for (const response of results) {
      vi.mocked(api.runTarget).mockResolvedValue(response);

      const { result } = renderHook(() => useRunTarget(), { wrapper: createWrapper() });

      result.current.mutate({ id: '1' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(response);
    }
  });
});

describe('Query key structure', () => {
  it('should have correct query key structure for targets', () => {
    expect(queryKeys.targets.all).toEqual(['targets']);
    expect(queryKeys.targets.list()).toEqual(['targets', 'list', undefined]);
    expect(queryKeys.targets.list({ enabled: true })).toEqual([
      'targets',
      'list',
      { enabled: true },
    ]);
    expect(queryKeys.targets.detail('1')).toEqual(['targets', 'detail', '1']);
    expect(queryKeys.targets.snapshots('1')).toEqual(['targets', 'snapshots', '1']);
    expect(queryKeys.targets.changes('1')).toEqual(['targets', 'changes', '1']);
  });

  it('should have correct query key structure for changes', () => {
    expect(queryKeys.changes.all).toEqual(['changes']);
    expect(queryKeys.changes.list()).toEqual(['changes', 'list', undefined]);
    expect(queryKeys.changes.list({ size: 10 })).toEqual(['changes', 'list', { size: 10 }]);
    expect(queryKeys.changes.detail('1')).toEqual(['changes', 'detail', '1']);
  });
});

describe('Query invalidation', () => {
  it('should invalidate correct queries after create', async () => {
    const mockTarget: Target = {
      id: '1',
      name: 'Test',
      url: 'https://example.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: null,
      ignoreRegexes: [],
      intervalMinutes: 60,
      nextRun: null,
      lastRun: null,
      lastStatus: 'NEVER_RUN',
      lastError: null,
    };

    vi.mocked(api.createTarget).mockResolvedValue(mockTarget);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateTarget(), { wrapper });

    result.current.mutate({
      name: 'Test',
      url: 'https://example.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: '',
      ignoreRegexes: [],
      intervalMinutes: 60,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.all });
  });

  it('should invalidate correct queries after update', async () => {
    const mockTarget: Target = {
      id: '1',
      name: 'Updated',
      url: 'https://example.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: null,
      ignoreRegexes: [],
      intervalMinutes: 60,
      nextRun: null,
      lastRun: null,
      lastStatus: 'OK',
      lastError: null,
    };

    vi.mocked(api.updateTarget).mockResolvedValue(mockTarget);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateTarget(), { wrapper });

    result.current.mutate({ id: '1', data: { name: 'Updated' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.detail('1') });
  });

  it('should invalidate correct queries after run', async () => {
    vi.mocked(api.runTarget).mockResolvedValue({
      result: 'CHANGED',
      changeId: 'change-1',
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRunTarget(), { wrapper });

    result.current.mutate({ id: '1' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(3);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.detail('1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.targets.changes('1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.changes.all });
  });
});
