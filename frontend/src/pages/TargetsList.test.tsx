import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TimeProvider } from '@/contexts/TimeContext';
import TargetsList from './TargetsList';
import * as queries from '@/lib/api/queries';
import type { Target } from '@/lib/api/types';

// Mock the queries module
vi.mock('@/lib/api/queries', async () => {
  const actual = await vi.importActual('@/lib/api/queries');
  return {
    ...actual,
    useTargets: vi.fn(),
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
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TimeProvider>{children}</TimeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('TargetsList', () => {
  const mockTargets: Target[] = [
    {
      id: '1',
      name: 'Example Target',
      url: 'https://example.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: null,
      ignoreRegexes: [],
      intervalMinutes: 60,
      nextRun: new Date(Date.now() + 3600000).toISOString(),
      lastRun: new Date(Date.now() - 1000).toISOString(),
      lastStatus: 'OK',
      lastError: null,
    },
    {
      id: '2',
      name: 'Playwright Target',
      url: 'https://playwright.com',
      enabled: false,
      mode: 'PLAYWRIGHT',
      cssSelector: '.content',
      ignoreRegexes: ['\\d{4}-\\d{2}-\\d{2}'],
      intervalMinutes: 30,
      nextRun: null,
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      lastStatus: 'ERROR',
      lastError: 'Timeout',
    },
    {
      id: '3',
      name: 'Never Run Target',
      url: 'https://neverrun.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: null,
      ignoreRegexes: [],
      intervalMinutes: 120,
      nextRun: null,
      lastRun: null,
      lastStatus: null,
      lastError: null,
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('list rendering', () => {
    it('should render list of targets', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      expect(screen.getByText('Playwright Target')).toBeInTheDocument();
      expect(screen.getByText('Never Run Target')).toBeInTheDocument();
    });

    it('should display target URLs', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument();
      });

      expect(screen.getByText('https://playwright.com')).toBeInTheDocument();
      expect(screen.getByText('https://neverrun.com')).toBeInTheDocument();
    });

    it('should display status badges', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('OK')).toBeInTheDocument();
      });

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Never Run')).toBeInTheDocument();
    });

    it('should display mode badges', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getAllByText('TEXT').length).toBeGreaterThan(0);
      });

      expect(screen.getByText('PLAYWRIGHT')).toBeInTheDocument();
    });

    it('should show loading skeletons', () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const { container } = render(<TargetsList />, { wrapper: createTestWrapper() });

      const skeletons = container.querySelectorAll('.shimmer');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('search filter with debounce', () => {
    it('should filter targets by name', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search targets...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search targets...');
      await user.type(searchInput, 'Example');

      // Wait for debounce (300ms)
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
        expect(screen.queryByText('Playwright Target')).not.toBeInTheDocument();
        expect(screen.queryByText('Never Run Target')).not.toBeInTheDocument();
      });
    });

    it('should filter targets by URL', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search targets...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search targets...');
      await user.type(searchInput, 'playwright.com');

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Playwright Target')).toBeInTheDocument();
        expect(screen.queryByText('Example Target')).not.toBeInTheDocument();
      });
    });

    it('should debounce search input', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search targets...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search targets...');

      // Type multiple characters quickly
      await user.type(searchInput, 'Ex');

      // Before debounce time, all should still be visible
      expect(screen.getByText('Example Target')).toBeInTheDocument();
      expect(screen.getByText('Playwright Target')).toBeInTheDocument();

      // Wait for debounce
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
        expect(screen.queryByText('Playwright Target')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search targets...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search targets...');
      await user.type(searchInput, 'EXAMPLE');

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });
    });
  });

  describe('status and mode filters', () => {
    it('should filter by enabled status', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      // Find and click status filter
      const statusTriggers = screen.getAllByRole('combobox');
      const statusTrigger = statusTriggers[0];
      await user.click(statusTrigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Enabled' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Enabled' }));

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
        expect(screen.getByText('Never Run Target')).toBeInTheDocument();
        expect(screen.queryByText('Playwright Target')).not.toBeInTheDocument();
      });
    });

    it('should filter by disabled status', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      const statusTriggers = screen.getAllByRole('combobox');
      await user.click(statusTriggers[0]);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Disabled' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Disabled' }));

      await waitFor(() => {
        expect(screen.getByText('Playwright Target')).toBeInTheDocument();
        expect(screen.queryByText('Example Target')).not.toBeInTheDocument();
      });
    });

    it('should filter by mode', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      const modeTriggers = screen.getAllByRole('combobox');
      const modeTrigger = modeTriggers[1]; // Second combobox is mode
      await user.click(modeTrigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Playwright' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Playwright' }));

      await waitFor(() => {
        expect(screen.getByText('Playwright Target')).toBeInTheDocument();
        expect(screen.queryByText('Example Target')).not.toBeInTheDocument();
      });
    });

    it('should combine multiple filters', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      // Search + filter
      const searchInput = screen.getByPlaceholderText('Search targets...');
      await user.type(searchInput, 'Target');
      vi.advanceTimersByTime(300);

      const statusTriggers = screen.getAllByRole('combobox');
      await user.click(statusTriggers[0]);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Enabled' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Enabled' }));

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
        expect(screen.getByText('Never Run Target')).toBeInTheDocument();
        expect(screen.queryByText('Playwright Target')).not.toBeInTheDocument();
      });
    });
  });

  describe('actions', () => {
    it('should run target when run action clicked', async () => {
      mockRunTargetMutation.mutateAsync.mockResolvedValue({
        result: 'NO_CHANGE',
        changeId: null,
      });

      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      // Find and open dropdown menu
      const row = screen.getByText('Example Target').closest('tr');
      const dropdownButton = within(row!).getByRole('button');
      await user.click(dropdownButton);

      await waitFor(() => {
        expect(screen.getByText('Run Now')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Run Now'));

      await waitFor(() => {
        expect(mockRunTargetMutation.mutateAsync).toHaveBeenCalledWith({ id: '1' });
      });
    });

    it('should toggle enabled status', async () => {
      mockUpdateTargetMutation.mutateAsync.mockResolvedValue(mockTargets[0]);

      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      const row = screen.getByText('Example Target').closest('tr');
      const dropdownButton = within(row!).getByRole('button');
      await user.click(dropdownButton);

      await waitFor(() => {
        expect(screen.getByText('Disable')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Disable'));

      await waitFor(() => {
        expect(mockUpdateTargetMutation.mutateAsync).toHaveBeenCalledWith({
          id: '1',
          data: { enabled: false },
        });
      });
    });

    it('should open delete confirmation', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      const row = screen.getByText('Example Target').closest('tr');
      const dropdownButton = within(row!).getByRole('button');
      await user.click(dropdownButton);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.getByText('Delete Target')).toBeInTheDocument();
        expect(
          screen.getByText(/Are you sure you want to delete "Example Target"/)
        ).toBeInTheDocument();
      });
    });

    it('should delete target after confirmation', async () => {
      mockDeleteTargetMutation.mutateAsync.mockResolvedValue(undefined);

      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      const row = screen.getByText('Example Target').closest('tr');
      const dropdownButton = within(row!).getByRole('button');
      await user.click(dropdownButton);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteTargetMutation.mutateAsync).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('copy URL functionality', () => {
    it('should copy URL to clipboard', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Example Target')).toBeInTheDocument();
      });

      const row = screen.getByText('Example Target').closest('tr');
      const dropdownButton = within(row!).getByRole('button');
      await user.click(dropdownButton);

      await waitFor(() => {
        expect(screen.getByText('Copy URL')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Copy URL'));

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com');
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state when no targets', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No targets yet')).toBeInTheDocument();
      });

      expect(screen.getByText('Create your first target to start monitoring')).toBeInTheDocument();
    });

    it('should show no matching state when filters return empty', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search targets...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search targets...');
      await user.type(searchInput, 'nonexistent');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('No matching targets')).toBeInTheDocument();
      });

      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error state when fetch fails', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: vi.fn(),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('should have retry button in error state', async () => {
      const refetch = vi.fn();

      vi.mocked(queries.useTargets).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useRunTarget).mockReturnValue(
        mockRunTargetMutation as ReturnType<typeof queries.useRunTarget>
      );
      vi.mocked(queries.useUpdateTarget).mockReturnValue(
        mockUpdateTargetMutation as ReturnType<typeof queries.useUpdateTarget>
      );
      vi.mocked(queries.useDeleteTarget).mockReturnValue(
        mockDeleteTargetMutation as ReturnType<typeof queries.useDeleteTarget>
      );

      const user = userEvent.setup({ delay: null });
      render(<TargetsList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(refetch).toHaveBeenCalled();
    });
  });
});
