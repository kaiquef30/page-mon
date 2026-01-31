import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TimeProvider } from '@/contexts/TimeContext';
import Dashboard from './Dashboard';
import * as queries from '@/lib/api/queries';
import type { Target, Change } from '@/lib/api/types';

// Mock the queries module
vi.mock('@/lib/api/queries', async () => {
  const actual = await vi.importActual('@/lib/api/queries');
  return {
    ...actual,
    useTargets: vi.fn(),
    useChanges: vi.fn(),
  };
});

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
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

describe('Dashboard', () => {
  const mockTargets: Target[] = [
    {
      id: '1',
      name: 'Target 1',
      url: 'https://example1.com',
      enabled: true,
      mode: 'TEXT',
      cssSelector: null,
      ignoreRegexes: [],
      intervalMinutes: 60,
      nextRun: new Date(Date.now() + 3600000).toISOString(),
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      lastStatus: 'OK',
      lastError: null,
    },
    {
      id: '2',
      name: 'Target 2',
      url: 'https://example2.com',
      enabled: true,
      mode: 'PLAYWRIGHT',
      cssSelector: '.content',
      ignoreRegexes: [],
      intervalMinutes: 30,
      nextRun: null,
      lastRun: new Date(Date.now() - 1800000).toISOString(),
      lastStatus: 'ERROR',
      lastError: 'Connection timeout',
    },
    {
      id: '3',
      name: 'Target 3',
      url: 'https://example3.com',
      enabled: false,
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

  const mockChanges: Change[] = [
    {
      id: 'change-1',
      targetId: '1',
      targetName: 'Target 1',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      diff: 'diff content',
      linesAdded: 10,
      linesRemoved: 5,
    },
    {
      id: 'change-2',
      targetId: '2',
      targetName: 'Target 2',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      diff: 'diff content 2',
      linesAdded: 3,
      linesRemoved: 8,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show skeleton while loading', () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      // Should show skeleton loader (implementation specific)
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('stats calculation', () => {
    it('should calculate total targets correctly', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Total should be 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should calculate enabled targets correctly', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // 2 enabled targets
      expect(screen.getByText('2 enabled')).toBeInTheDocument();
    });

    it('should calculate error targets correctly', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // 1 error (Target 2)
      const errorCards = screen.getAllByText('1');
      expect(errorCards.length).toBeGreaterThan(0);
    });

    it('should calculate healthy targets correctly', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // 1 OK (Target 1)
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('should calculate due now targets correctly', async () => {
      const targetsWithDue: Target[] = [
        ...mockTargets,
        {
          id: '4',
          name: 'Due Target',
          url: 'https://example4.com',
          enabled: true,
          mode: 'TEXT',
          cssSelector: null,
          ignoreRegexes: [],
          intervalMinutes: 60,
          nextRun: new Date(Date.now() - 100).toISOString(), // Past date
          lastRun: new Date(Date.now() - 3700000).toISOString(),
          lastStatus: 'OK',
          lastError: null,
        },
      ];

      vi.mocked(queries.useTargets).mockReturnValue({
        data: targetsWithDue,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Due Now')).toBeInTheDocument();
    });

    it('should handle all zeros', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Should show zeros in KPI cards
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });
  });

  describe('operational issues display', () => {
    it('should show targets with errors', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      });

      expect(screen.getByText('Target 2')).toBeInTheDocument();
      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
    });

    it('should show targets that are due now', async () => {
      const targetsWithDue: Target[] = [
        {
          id: '4',
          name: 'Overdue Target',
          url: 'https://overdue.com',
          enabled: true,
          mode: 'TEXT',
          cssSelector: null,
          ignoreRegexes: [],
          intervalMinutes: 60,
          nextRun: new Date(Date.now() - 1000).toISOString(),
          lastRun: new Date(Date.now() - 3700000).toISOString(),
          lastStatus: 'OK',
          lastError: null,
        },
      ];

      vi.mocked(queries.useTargets).mockReturnValue({
        data: targetsWithDue,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      });

      expect(screen.getByText('Overdue Target')).toBeInTheDocument();
    });

    it('should prioritize errors over due targets', async () => {
      const mixedTargets: Target[] = [
        {
          id: '1',
          name: 'Error Target',
          url: 'https://error.com',
          enabled: true,
          mode: 'TEXT',
          cssSelector: null,
          ignoreRegexes: [],
          intervalMinutes: 60,
          nextRun: new Date(Date.now() + 1000).toISOString(),
          lastRun: new Date(Date.now() - 1000).toISOString(),
          lastStatus: 'ERROR',
          lastError: 'Failed',
        },
        {
          id: '2',
          name: 'Due Target',
          url: 'https://due.com',
          enabled: true,
          mode: 'TEXT',
          cssSelector: null,
          ignoreRegexes: [],
          intervalMinutes: 60,
          nextRun: new Date(Date.now() - 1000).toISOString(),
          lastRun: new Date(Date.now() - 3700000).toISOString(),
          lastStatus: 'OK',
          lastError: null,
        },
      ];

      vi.mocked(queries.useTargets).mockReturnValue({
        data: mixedTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      const { container } = render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      });

      // Error target should appear before due target
      const items = container.querySelectorAll('a[href*="/targets/"]');
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].textContent).toContain('Error Target');
    });

    it('should show "all systems operational" when no issues', async () => {
      const healthyTargets: Target[] = [
        {
          id: '1',
          name: 'Healthy Target',
          url: 'https://healthy.com',
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
      ];

      vi.mocked(queries.useTargets).mockReturnValue({
        data: healthyTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('All systems operational')).toBeInTheDocument();
      });

      expect(screen.getByText('No issues require attention')).toBeInTheDocument();
    });

    it('should limit to 5 operational issues', async () => {
      const manyIssues: Target[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i + 1),
        name: `Issue Target ${i + 1}`,
        url: `https://issue${i + 1}.com`,
        enabled: true,
        mode: 'TEXT' as const,
        cssSelector: null,
        ignoreRegexes: [],
        intervalMinutes: 60,
        nextRun: new Date(Date.now() - 1000).toISOString(),
        lastRun: new Date(Date.now() - 3700000).toISOString(),
        lastStatus: 'OK' as const,
        lastError: null,
      }));

      vi.mocked(queries.useTargets).mockReturnValue({
        data: manyIssues,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      const { container } = render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      });

      const issueItems = container.querySelectorAll('a[href*="/targets/"]');
      expect(issueItems.length).toBeLessThanOrEqual(5);
    });
  });

  describe('recent changes display', () => {
    it('should display recent changes', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: mockChanges,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Recent Changes')).toBeInTheDocument();
      });

      expect(screen.getByText('Target 1')).toBeInTheDocument();
      expect(screen.getByText('Target 2')).toBeInTheDocument();
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('should show loading skeleton for changes', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      const { container } = render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Recent Changes')).toBeInTheDocument();
      });

      // Should show skeleton loaders
      const skeletons = container.querySelectorAll('.shimmer');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show empty state when no changes', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No changes yet')).toBeInTheDocument();
      });

      expect(screen.getByText('Changes will appear here when detected')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no targets', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No targets configured')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Create your first target to start monitoring web pages for changes.')
      ).toBeInTheDocument();
    });

    it('should have create target button in empty state', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No targets configured')).toBeInTheDocument();
      });

      const createButtons = screen.getAllByText('Create Target');
      expect(createButtons.length).toBeGreaterThan(0);
    });
  });

  describe('error state', () => {
    it('should show error state when targets fail to load', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load targets'),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Failed to load targets')).toBeInTheDocument();
      });
    });

    it('should have retry button in error state', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call reload when retry clicked', async () => {
      const reloadSpy = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true,
      });

      vi.mocked(queries.useTargets).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed'),
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      const user = userEvent.setup();
      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('should have link to create target', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      const createLink = screen.getByRole('link', { name: /create target/i });
      expect(createLink).toHaveAttribute('href', '/targets/new');
    });

    it('should have link to view all changes', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: mockChanges,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Recent Changes')).toBeInTheDocument();
      });

      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toHaveAttribute('href', '/targets');
    });

    it('should have links to target detail pages', async () => {
      vi.mocked(queries.useTargets).mockReturnValue({
        data: mockTargets,
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useTargets>);

      vi.mocked(queries.useChanges).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof queries.useChanges>);

      const { container } = render(<Dashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      });

      const targetLinks = container.querySelectorAll('a[href*="/targets/"]');
      expect(targetLinks.length).toBeGreaterThan(0);
    });
  });
});
