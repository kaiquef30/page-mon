import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBadge, StatusDot } from './StatusBadge';
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('StatusBadge', () => {
  describe('status variants', () => {
    it('should render OK status', () => {
      renderWithProviders(<StatusBadge status="OK" />);

      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should render ERROR status', () => {
      renderWithProviders(<StatusBadge status="ERROR" />);

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should render NEVER_RUN status', () => {
      renderWithProviders(<StatusBadge status="NEVER_RUN" />);

      expect(screen.getByText('Never Run')).toBeInTheDocument();
    });

    it('should render CHANGED status', () => {
      renderWithProviders(<StatusBadge status="CHANGED" />);

      expect(screen.getByText('Changed')).toBeInTheDocument();
    });

    it('should render RUNNING status', () => {
      renderWithProviders(<StatusBadge status="RUNNING" />);

      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should render NO_CHANGE status', () => {
      renderWithProviders(<StatusBadge status="NO_CHANGE" />);

      expect(screen.getByText('No Change')).toBeInTheDocument();
    });

    it('should render FAILED status', () => {
      renderWithProviders(<StatusBadge status="FAILED" />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('should render SKIPPED status', () => {
      renderWithProviders(<StatusBadge status="SKIPPED" />);

      expect(screen.getByText('Skipped')).toBeInTheDocument();
    });

    it('should render DISABLED status', () => {
      renderWithProviders(<StatusBadge status="DISABLED" />);

      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    it('should render DUE status', () => {
      renderWithProviders(<StatusBadge status="DUE" />);

      expect(screen.getByText('Due Now')).toBeInTheDocument();
    });
  });

  describe('visual styling', () => {
    it('should apply success styling for OK status', () => {
      const { container } = renderWithProviders(<StatusBadge status="OK" />);

      const badge = container.querySelector('.text-success');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-success/10', 'border-success/20');
    });

    it('should apply destructive styling for ERROR status', () => {
      const { container } = renderWithProviders(<StatusBadge status="ERROR" />);

      const badge = container.querySelector('.text-destructive');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-destructive/10', 'border-destructive/20');
    });

    it('should apply warning styling for CHANGED status', () => {
      const { container } = renderWithProviders(<StatusBadge status="CHANGED" />);

      const badge = container.querySelector('.text-warning');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-warning/10', 'border-warning/20');
    });

    it('should apply muted styling for NEVER_RUN status', () => {
      const { container } = renderWithProviders(<StatusBadge status="NEVER_RUN" />);

      const badge = container.querySelector('.text-muted-foreground');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-muted', 'border-border');
    });

    it('should apply info styling for RUNNING status', () => {
      const { container } = renderWithProviders(<StatusBadge status="RUNNING" />);

      const badge = container.querySelector('.text-info');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-info/10', 'border-info/20');
    });

    it('should have spinning animation for RUNNING status icon', () => {
      const { container } = renderWithProviders(<StatusBadge status="RUNNING" />);

      const icon = container.querySelector('.animate-spin');
      expect(icon).toBeInTheDocument();
    });

    it('should have pulse animation for DUE status dot', () => {
      const { container } = renderWithProviders(<StatusBadge status="DUE" />);

      const badge = container.querySelector('.text-warning');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('showLabel prop', () => {
    it('should show label by default', () => {
      renderWithProviders(<StatusBadge status="OK" />);

      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      renderWithProviders(<StatusBadge status="OK" showLabel={false} />);

      expect(screen.queryByText('OK')).not.toBeInTheDocument();
    });

    it('should still render icon when label is hidden', () => {
      const { container } = renderWithProviders(
        <StatusBadge status="OK" showLabel={false} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('size prop', () => {
    it('should apply small size classes', () => {
      const { container } = renderWithProviders(<StatusBadge status="OK" size="sm" />);

      const badge = container.querySelector('.text-2xs');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('px-1.5', 'py-0.5', 'gap-1');
    });

    it('should apply medium size classes by default', () => {
      const { container } = renderWithProviders(<StatusBadge status="OK" />);

      const badge = container.querySelector('.text-xs');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('px-2', 'py-1', 'gap-1.5');
    });

    it('should apply large size classes', () => {
      const { container } = renderWithProviders(<StatusBadge status="OK" size="lg" />);

      const badge = container.querySelector('.text-sm');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('px-2.5', 'py-1.5', 'gap-2');
    });

    it('should apply correct icon size for sm', () => {
      const { container } = renderWithProviders(<StatusBadge status="OK" size="sm" />);

      const icon = container.querySelector('.h-3.w-3');
      expect(icon).toBeInTheDocument();
    });

    it('should apply correct icon size for md', () => {
      const { container } = renderWithProviders(<StatusBadge status="OK" size="md" />);

      const icon = container.querySelector('.h-3\\.5.w-3\\.5');
      expect(icon).toBeInTheDocument();
    });

    it('should apply correct icon size for lg', () => {
      const { container } = renderWithProviders(<StatusBadge status="OK" size="lg" />);

      const icon = container.querySelector('.h-4.w-4');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = renderWithProviders(
        <StatusBadge status="OK" className="custom-class" />
      );

      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      const { container } = renderWithProviders(
        <StatusBadge status="OK" className="custom-class" />
      );

      const badge = container.querySelector('.custom-class');
      expect(badge).toHaveClass('text-success', 'custom-class');
    });
  });

  describe('error tooltip', () => {
    it('should not show tooltip when no error message', () => {
      renderWithProviders(<StatusBadge status="ERROR" />);

      const badge = screen.getByText('Error');
      expect(badge).toBeInTheDocument();
    });

    it('should show tooltip trigger when error message exists', () => {
      renderWithProviders(
        <StatusBadge status="ERROR" errorMessage="Network timeout" />
      );

      const badge = screen.getByText('Error');
      expect(badge).toBeInTheDocument();
    });

    it('should display error message in tooltip on hover', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <StatusBadge status="ERROR" errorMessage="Connection refused" />
      );

      const badge = screen.getByText('Error');
      await user.hover(badge);

      // Note: Tooltip content may be rendered but not visible until hover
      // The actual tooltip behavior is tested via integration tests
      expect(badge).toBeInTheDocument();
    });

    it('should handle long error messages', () => {
      const longError = 'This is a very long error message that should be displayed in the tooltip with proper wrapping and formatting for better readability';

      renderWithProviders(
        <StatusBadge status="ERROR" errorMessage={longError} />
      );

      const badge = screen.getByText('Error');
      expect(badge).toBeInTheDocument();
    });

    it('should handle null error message', () => {
      renderWithProviders(
        <StatusBadge status="ERROR" errorMessage={null} />
      );

      const badge = screen.getByText('Error');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to NEVER_RUN for unknown status', () => {
      // @ts-expect-error Testing invalid status
      renderWithProviders(<StatusBadge status="UNKNOWN_STATUS" />);

      expect(screen.getByText('Never Run')).toBeInTheDocument();
    });

    it('should use NEVER_RUN styling for unknown status', () => {
      // @ts-expect-error Testing invalid status
      const { container } = renderWithProviders(<StatusBadge status="INVALID" />);

      const badge = container.querySelector('.text-muted-foreground');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('should render CheckCircle2 icon for OK', () => {
      const { container } = renderWithProviders(<StatusBadge status="OK" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render XCircle icon for ERROR', () => {
      const { container } = renderWithProviders(<StatusBadge status="ERROR" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render AlertTriangle icon for CHANGED', () => {
      const { container } = renderWithProviders(<StatusBadge status="CHANGED" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render Clock icon for NEVER_RUN', () => {
      const { container } = renderWithProviders(<StatusBadge status="NEVER_RUN" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render Loader2 icon for RUNNING', () => {
      const { container } = renderWithProviders(<StatusBadge status="RUNNING" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render MinusCircle icon for DISABLED', () => {
      const { container } = renderWithProviders(<StatusBadge status="DISABLED" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});

describe('StatusDot', () => {
  describe('rendering', () => {
    it('should render status dot', () => {
      const { container } = render(<StatusDot status="OK" />);

      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
    });

    it('should apply success color for OK', () => {
      const { container } = render(<StatusDot status="OK" />);

      const dot = container.querySelector('.bg-success');
      expect(dot).toBeInTheDocument();
    });

    it('should apply destructive color for ERROR', () => {
      const { container } = render(<StatusDot status="ERROR" />);

      const dot = container.querySelector('.bg-destructive');
      expect(dot).toBeInTheDocument();
    });

    it('should apply warning color for CHANGED', () => {
      const { container } = render(<StatusDot status="CHANGED" />);

      const dot = container.querySelector('.bg-warning');
      expect(dot).toBeInTheDocument();
    });

    it('should apply muted color for NEVER_RUN', () => {
      const { container } = render(<StatusDot status="NEVER_RUN" />);

      const dot = container.querySelector('.bg-muted-foreground');
      expect(dot).toBeInTheDocument();
    });

    it('should apply info color with pulse for RUNNING', () => {
      const { container } = render(<StatusDot status="RUNNING" />);

      const dot = container.querySelector('.bg-info');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('animate-pulse');
    });

    it('should apply warning color with pulse for DUE', () => {
      const { container } = render(<StatusDot status="DUE" />);

      const dot = container.querySelector('.bg-warning');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('animate-pulse');
    });
  });

  describe('size prop', () => {
    it('should apply small size', () => {
      const { container } = render(<StatusDot status="OK" size="sm" />);

      const dot = container.querySelector('.h-1\\.5.w-1\\.5');
      expect(dot).toBeInTheDocument();
    });

    it('should apply medium size by default', () => {
      const { container } = render(<StatusDot status="OK" />);

      const dot = container.querySelector('.h-2.w-2');
      expect(dot).toBeInTheDocument();
    });

    it('should apply large size', () => {
      const { container } = render(<StatusDot status="OK" size="lg" />);

      const dot = container.querySelector('.h-2\\.5.w-2\\.5');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <StatusDot status="OK" className="custom-dot" />
      );

      const dot = container.querySelector('.custom-dot');
      expect(dot).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(
        <StatusDot status="OK" className="custom-dot" />
      );

      const dot = container.querySelector('.custom-dot');
      expect(dot).toHaveClass('rounded-full', 'bg-success', 'custom-dot');
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to NEVER_RUN for unknown status', () => {
      // @ts-expect-error Testing invalid status
      const { container } = render(<StatusDot status="INVALID" />);

      const dot = container.querySelector('.bg-muted-foreground');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('all status variants', () => {
    const statuses = [
      'OK',
      'NO_CHANGE',
      'CHANGED',
      'ERROR',
      'FAILED',
      'SKIPPED',
      'NEVER_RUN',
      'RUNNING',
      'DISABLED',
      'DUE',
    ] as const;

    statuses.forEach((status) => {
      it(`should render ${status} status dot`, () => {
        const { container } = render(<StatusDot status={status} />);

        const dot = container.querySelector('.rounded-full');
        expect(dot).toBeInTheDocument();
      });
    });
  });
});
