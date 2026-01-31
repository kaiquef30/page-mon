import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TimeProvider } from '@/contexts/TimeContext';
import TargetDetail from './TargetDetail';
import * as queries from '@/lib/api/queries';
import type { Target, Change, Snapshot } from '@/lib/api/types';

// Mock the queries module
vi.mock('@/lib/api/queries', async () => {
  const actual = await vi.importActual('@/lib/api/queries');
  return {
    ...actual,
    useTarget: vi.fn(),
    useTargetChanges: vi.fn(),
    useTargetSnapshots: vi.fn(),
    useRunTarget: vi.fn(),
    useUpdateTarget: vi.fn(),
    useDeleteTarget: vi.fn(),
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

function createTestWrapper(initialRoute = '/targets/test-id-1') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TimeProvider>
          <Routes>
            <Route path="/targets/:id" element={children} />
          </Routes>
        </TimeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('TargetDetail', () => {
  const mockTarget: Target = {
    id: 'test-id-1',
    name: 'Test Target',
    url: 'https://example.com',
    enabled: true,
    mode: 'TEXT',
    cssSelector: '.content',
    ignoreRegexes: ['\\d{4}-\\d{2}-\\d{2}', 'timestamp:\\s*\\d+'],
    intervalMinutes: 60,
    nextRun: new Date(Date.now() + 3600000).toISOString(),
    lastRun: new Date(Date.now() - 1000).toISOString(),
    lastStatus: 'OK',
    lastError: null,
  };

  const mockChanges: Change[] = [
    {
      id: 'change-1',
      targetId: 'test-id-1',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      diff: 'diff content 1',
      linesAdded: 10,
      linesRemoved: 5,
    },
    {
      id: 'change-2',
      targetId: 'test-id-1',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      diff: 'diff content 2',
      linesAdded: 3,
      linesRemoved: 8,
    },
  ];

  const mockSnapshots: Snapshot[] = [
    {
      id: 'snapshot-1',
      targetId: 'test-id-1',
      fetchedAt: new Date(Date.now() - 1000).toISOString(),
      httpStatus: 200,
      etag: 'abc123',
      lastModified: null,
      hash: 'hash1234567890abcdef',
    },
    {
      id: 'snapshot-2',
      targetId: 'test-id-1',
      fetchedAt: new Date(Date.now() - 3600000).toISOString(),
      httpStatus: 200,
      etag: 'def456',
      lastModified: null,
      hash: 'hash0987654321fedcba',
    },
  ];

  const mockRunTargetMutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
  };

  const mockUpdateTargetMutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
  };

  const mockDeleteTargetMutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/targets/test-id-1');
  });

  describe('loading state', () => {
    it('should show skeleton while loading', () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      // Should not show target name yet
      expect(screen.queryByText('Test Target')).not.toBeInTheDocument();
    });
  });

  describe('target rendering', () => {
    it('should render target details', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: mockChanges,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: mockSnapshots,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Test Target')).toBeInTheDocument();
      });

      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });

    it('should render status badge', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
      });
    });
  });

  describe('tabs rendering', () => {
    it('should render tabs with counts', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: mockChanges,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: mockSnapshots,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Changes \(2\)/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Snapshots \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Settings/)).toBeInTheDocument();
    });

    it('should render changes tab content', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: mockChanges,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: mockSnapshots,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('+10')).toBeInTheDocument();
      });

      expect(screen.getByText('-5')).toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument();
      expect(screen.getByText('-8')).toBeInTheDocument();
    });

    it('should render snapshots tab when clicked', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: mockChanges,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: mockSnapshots,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup();
      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Snapshots \(2\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Snapshots \(2\)/));

      await waitFor(() => {
        expect(screen.getByText('hash1234')).toBeInTheDocument();
      });

      expect(screen.getByText('hash0987')).toBeInTheDocument();
    });

    it('should render settings tab when clicked', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: mockChanges,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: mockSnapshots,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup();
      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Settings/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Settings/));

      await waitFor(() => {
        expect(screen.getByText('Configuration')).toBeInTheDocument();
      });

      expect(screen.getByText('TEXT')).toBeInTheDocument();
      expect(screen.getByText('60 minutes')).toBeInTheDocument();
      expect(screen.getByText('.content')).toBeInTheDocument();
    });
  });

  describe('lazy loading', () => {
    it('should only fetch changes when changes tab is active', async () => {
      const useTargetChangesSpy = vi.fn().mockReturnValue({
        data: mockChanges,
        isLoading: false,
      });

      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockImplementation(useTargetChangesSpy);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: mockSnapshots,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Test Target')).toBeInTheDocument();
      });

      // Changes tab is default, so it should be enabled
      expect(useTargetChangesSpy).toHaveBeenCalledWith('test-id-1', { enabled: true });
    });

    it('should only fetch snapshots when snapshots tab is active', async () => {
      const useTargetSnapshotsSpy = vi.fn().mockReturnValue({
        data: [],
        isLoading: false,
      });

      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: mockChanges,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockImplementation(useTargetSnapshotsSpy);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Test Target')).toBeInTheDocument();
      });

      // Initially snapshots should be disabled (changes tab is default)
      expect(useTargetSnapshotsSpy).toHaveBeenCalledWith('test-id-1', { enabled: false });
    });

    it('should enable snapshots query when tab is clicked', async () => {
      const useTargetSnapshotsSpy = vi.fn().mockReturnValue({
        data: mockSnapshots,
        isLoading: false,
      });

      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: mockChanges,
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockImplementation(useTargetSnapshotsSpy);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup();
      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Snapshots/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Snapshots \(2\)/));

      await waitFor(() => {
        // After clicking, snapshots should be enabled
        const calls = useTargetSnapshotsSpy.mock.calls;
        expect(calls[calls.length - 1][1]).toEqual({ enabled: true });
      });
    });
  });

  describe('run target action', () => {
    it('should run target without force by default', async () => {
      mockRunTargetMutation.mutateAsync.mockResolvedValue({
        result: 'NO_CHANGE',
        changeId: null,
      });

      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup();
      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /run now/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /run now/i }));

      await waitFor(() => {
        expect(mockRunTargetMutation.mutateAsync).toHaveBeenCalledWith({
          id: 'test-id-1',
          force: false,
        });
      });
    });

    it('should run target with force when switch enabled', async () => {
      mockRunTargetMutation.mutateAsync.mockResolvedValue({
        result: 'CHANGED',
        changeId: 'new-change',
      });

      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup();
      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText('Force')).toBeInTheDocument();
      });

      // Enable force run
      const forceSwitch = screen.getByRole('switch');
      await user.click(forceSwitch);

      await user.click(screen.getByRole('button', { name: /run now/i }));

      await waitFor(() => {
        expect(mockRunTargetMutation.mutateAsync).toHaveBeenCalledWith({
          id: 'test-id-1',
          force: true,
        });
      });
    });

    it('should show loading state while running', async () => {
      const pendingMutation = {
        ...mockRunTargetMutation,
        isPending: true,
      };

      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        pendingMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        const runButton = screen.getByRole('button', { name: /run now/i });
        expect(runButton).toBeDisabled();
      });
    });
  });

  describe('toggle enabled', () => {
    it('should toggle enabled status', async () => {
      mockUpdateTargetMutation.mutateAsync.mockResolvedValue(mockTarget);

      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup();
      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      // Find enabled switch in Status card
      const switches = screen.getAllByRole('switch');
      const enabledSwitch = switches.find((sw) => sw.getAttribute('aria-checked') === 'true');

      if (enabledSwitch) {
        await user.click(enabledSwitch);

        await waitFor(() => {
          expect(mockUpdateTargetMutation.mutateAsync).toHaveBeenCalledWith({
            id: 'test-id-1',
            data: { enabled: false },
          });
        });
      }
    });
  });

  describe('delete target', () => {
    it('should show delete confirmation dialog', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup();
      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const deleteButton = buttons.find((btn) => {
          const svg = btn.querySelector('svg');
          return svg && btn.className.includes('destructive');
        });
        expect(deleteButton).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && btn.className.includes('destructive');
      });

      if (deleteButton) {
        await user.click(deleteButton);

        await waitFor(() => {
          expect(screen.getByText('Delete Target')).toBeInTheDocument();
          expect(screen.getByText(/permanently remove/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('error state', () => {
    it('should show error state when target fails to load', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Not found'),
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Not found')).toBeInTheDocument();
      });
    });

    it('should have retry button in error state', async () => {
      const refetch = vi.fn();

      vi.mocked(queries.useTarget).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch,
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup();
      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(refetch).toHaveBeenCalled();
    });
  });

  describe('empty states', () => {
    it('should show empty state for no changes', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No changes detected yet')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Changes will appear here when the monitored page content changes.')
      ).toBeInTheDocument();
    });

    it('should show empty state for no snapshots', async () => {
      vi.mocked(queries.useTarget).mockReturnValue({
        data: mockTarget,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTarget>);

      vi.mocked(queries.useTargetChanges).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetChanges>);

      vi.mocked(queries.useTargetSnapshots).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof queries.useTargetSnapshots>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup();
      render(<TargetDetail />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Snapshots/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Snapshots \(0\)/));

      await waitFor(() => {
        expect(screen.getByText('No snapshots yet')).toBeInTheDocument();
      });

      expect(screen.getByText('Snapshots are created after each successful run.')).toBeInTheDocument();
    });
  });
});
