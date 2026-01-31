import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState, ErrorState, OfflineState } from './EmptyState';

describe('EmptyState', () => {
  describe('basic rendering', () => {
    it('should render with title', () => {
      render(<EmptyState title="No items found" />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should render with title and description', () => {
      render(
        <EmptyState
          title="No items found"
          description="Try adjusting your search criteria"
        />
      );

      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
    });

    it('should render without description', () => {
      render(<EmptyState title="No items" />);

      expect(screen.getByText('No items')).toBeInTheDocument();
      expect(screen.queryByText('description')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <EmptyState title="Test" className="custom-empty" />
      );

      const emptyState = container.querySelector('.custom-empty');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('default icon', () => {
    it('should render default FileQuestion icon', () => {
      const { container } = render(<EmptyState title="No items" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon in circular background', () => {
      const { container } = render(<EmptyState title="No items" />);

      const iconContainer = container.querySelector('.w-12.h-12.rounded-full.bg-muted');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('custom icon', () => {
    it('should render custom icon', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;

      render(<EmptyState title="Test" icon={<CustomIcon />} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should not render default icon when custom icon provided', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;

      const { container } = render(<EmptyState title="Test" icon={<CustomIcon />} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('action button', () => {
    it('should not render action button when not provided', () => {
      render(<EmptyState title="No items" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render action button with label', () => {
      const action = { label: 'Add Item', onClick: vi.fn() };

      render(<EmptyState title="No items" action={action} />);

      expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    });

    it('should call onClick when action button clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const action = { label: 'Add Item', onClick };

      render(<EmptyState title="No items" action={action} />);

      const button = screen.getByRole('button', { name: 'Add Item' });
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should render button with outline variant', () => {
      const action = { label: 'Add Item', onClick: vi.fn() };

      render(<EmptyState title="No items" action={action} />);

      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('layout and styling', () => {
    it('should have centered layout', () => {
      const { container } = render(<EmptyState title="Test" />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });

    it('should have padding', () => {
      const { container } = render(<EmptyState title="Test" />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('py-12', 'px-4');
    });

    it('should have text-center class', () => {
      const { container } = render(<EmptyState title="Test" />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('text-center');
    });

    it('should have fade-in animation', () => {
      const { container } = render(<EmptyState title="Test" />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('animate-fade-in');
    });

    it('should limit description width', () => {
      const { container } = render(
        <EmptyState
          title="Test"
          description="This is a long description that should have limited width"
        />
      );

      const description = container.querySelector('.max-w-sm');
      expect(description).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render title as heading', () => {
      render(<EmptyState title="No items found" />);

      const heading = screen.getByRole('heading', { name: 'No items found' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('should have proper text hierarchy', () => {
      render(
        <EmptyState
          title="No items"
          description="Try adding some items"
        />
      );

      const title = screen.getByText('No items');
      const description = screen.getByText('Try adding some items');

      expect(title).toHaveClass('text-lg', 'font-semibold');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });
});

describe('ErrorState', () => {
  describe('basic rendering', () => {
    it('should render with default title', () => {
      render(<ErrorState message="Network error occurred" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<ErrorState title="Custom Error" message="Error details" />);

      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText('Error details')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ErrorState message="Error" className="custom-error" />
      );

      const errorState = container.querySelector('.custom-error');
      expect(errorState).toBeInTheDocument();
    });
  });

  describe('error icon', () => {
    it('should render AlertCircle icon', () => {
      const { container } = render(<ErrorState message="Error" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon in destructive background', () => {
      const { container } = render(<ErrorState message="Error" />);

      const iconContainer = container.querySelector('.bg-destructive\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have destructive icon color', () => {
      const { container } = render(<ErrorState message="Error" />);

      const icon = container.querySelector('.text-destructive');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('retry button', () => {
    it('should not render retry button when onRetry not provided', () => {
      render(<ErrorState message="Error occurred" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render retry button when onRetry provided', () => {
      render(<ErrorState message="Error occurred" onRetry={vi.fn()} />);

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<ErrorState message="Error occurred" onRetry={onRetry} />);

      const button = screen.getByRole('button', { name: /Try Again/i });
      await user.click(button);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should render RefreshCw icon in retry button', () => {
      const { container } = render(
        <ErrorState message="Error" onRetry={vi.fn()} />
      );

      const button = screen.getByRole('button', { name: /Try Again/i });
      expect(button).toBeInTheDocument();

      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should call onRetry multiple times', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<ErrorState message="Error" onRetry={onRetry} />);

      const button = screen.getByRole('button', { name: /Try Again/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('message styling', () => {
    it('should render message in monospace font', () => {
      const { container } = render(<ErrorState message="Error 404" />);

      const message = container.querySelector('.font-mono');
      expect(message).toBeInTheDocument();
      expect(message).toHaveTextContent('Error 404');
    });

    it('should handle long error messages', () => {
      const longMessage = 'This is a very long error message that contains lots of technical details about what went wrong during the operation';

      render(<ErrorState message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle HTML in error message', () => {
      const htmlMessage = '<script>alert("xss")</script>';

      render(<ErrorState message={htmlMessage} />);

      expect(screen.getByText(htmlMessage)).toBeInTheDocument();
    });
  });

  describe('layout and styling', () => {
    it('should have centered layout', () => {
      const { container } = render(<ErrorState message="Error" />);

      const errorState = container.firstChild;
      expect(errorState).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });

    it('should have fade-in animation', () => {
      const { container } = render(<ErrorState message="Error" />);

      const errorState = container.firstChild;
      expect(errorState).toHaveClass('animate-fade-in');
    });
  });

  describe('accessibility', () => {
    it('should render title as heading', () => {
      render(<ErrorState message="Error" />);

      const heading = screen.getByRole('heading', { name: 'Something went wrong' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });
  });
});

describe('OfflineState', () => {
  describe('basic rendering', () => {
    it('should render connection lost message', () => {
      render(<OfflineState />);

      expect(screen.getByText('Connection Lost')).toBeInTheDocument();
      expect(screen.getByText(/Unable to reach the server/)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<OfflineState className="custom-offline" />);

      const offlineState = container.querySelector('.custom-offline');
      expect(offlineState).toBeInTheDocument();
    });
  });

  describe('offline icon', () => {
    it('should render WifiOff icon', () => {
      const { container } = render(<OfflineState />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon in warning background', () => {
      const { container } = render(<OfflineState />);

      const iconContainer = container.querySelector('.bg-warning\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have warning icon color', () => {
      const { container } = render(<OfflineState />);

      const icon = container.querySelector('.text-warning');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('retry button', () => {
    it('should not render retry button when onRetry not provided', () => {
      render(<OfflineState />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render reconnect button when onRetry provided', () => {
      render(<OfflineState onRetry={vi.fn()} />);

      expect(screen.getByRole('button', { name: /Reconnect/i })).toBeInTheDocument();
    });

    it('should call onRetry when reconnect button clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<OfflineState onRetry={onRetry} />);

      const button = screen.getByRole('button', { name: /Reconnect/i });
      await user.click(button);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should render RefreshCw icon in reconnect button', () => {
      const { container } = render(<OfflineState onRetry={vi.fn()} />);

      const button = screen.getByRole('button', { name: /Reconnect/i });
      expect(button).toBeInTheDocument();

      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should call onRetry multiple times', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<OfflineState onRetry={onRetry} />);

      const button = screen.getByRole('button', { name: /Reconnect/i });
      await user.click(button);
      await user.click(button);

      expect(onRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('messages', () => {
    it('should render descriptive offline message', () => {
      render(<OfflineState />);

      expect(screen.getByText('Connection Lost')).toBeInTheDocument();
      expect(
        screen.getByText('Unable to reach the server. Check your connection and try again.')
      ).toBeInTheDocument();
    });
  });

  describe('layout and styling', () => {
    it('should have centered layout', () => {
      const { container } = render(<OfflineState />);

      const offlineState = container.firstChild;
      expect(offlineState).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });

    it('should have fade-in animation', () => {
      const { container } = render(<OfflineState />);

      const offlineState = container.firstChild;
      expect(offlineState).toHaveClass('animate-fade-in');
    });

    it('should have text-center class', () => {
      const { container } = render(<OfflineState />);

      const offlineState = container.firstChild;
      expect(offlineState).toHaveClass('text-center');
    });
  });

  describe('accessibility', () => {
    it('should render title as heading', () => {
      render(<OfflineState />);

      const heading = screen.getByRole('heading', { name: 'Connection Lost' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });
  });
});

describe('EmptyState integration', () => {
  describe('multiple states rendering', () => {
    it('should render different empty states independently', () => {
      const { rerender } = render(<EmptyState title="No results" />);
      expect(screen.getByText('No results')).toBeInTheDocument();

      rerender(<ErrorState message="Error occurred" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('No results')).not.toBeInTheDocument();

      rerender(<OfflineState />);
      expect(screen.getByText('Connection Lost')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('consistent styling across states', () => {
    it('should have consistent layout structure', () => {
      const { container: emptyContainer } = render(<EmptyState title="Empty" />);
      const { container: errorContainer } = render(<ErrorState message="Error" />);
      const { container: offlineContainer } = render(<OfflineState />);

      expect(emptyContainer.firstChild).toHaveClass('flex', 'flex-col', 'items-center');
      expect(errorContainer.firstChild).toHaveClass('flex', 'flex-col', 'items-center');
      expect(offlineContainer.firstChild).toHaveClass('flex', 'flex-col', 'items-center');
    });

    it('should have consistent icon container styling', () => {
      const { container: emptyContainer } = render(<EmptyState title="Empty" />);
      const { container: errorContainer } = render(<ErrorState message="Error" />);
      const { container: offlineContainer } = render(<OfflineState />);

      const emptyIcon = emptyContainer.querySelector('.w-12.h-12.rounded-full');
      const errorIcon = errorContainer.querySelector('.w-12.h-12.rounded-full');
      const offlineIcon = offlineContainer.querySelector('.w-12.h-12.rounded-full');

      expect(emptyIcon).toBeInTheDocument();
      expect(errorIcon).toBeInTheDocument();
      expect(offlineIcon).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty title gracefully', () => {
      render(<EmptyState title="" />);

      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('');
    });

    it('should handle very long titles', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines in the UI';

      render(<EmptyState title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle special characters in messages', () => {
      render(<ErrorState message="Error: 500 - Internal Server Error (10%) @ 2:00 PM" />);

      expect(screen.getByText(/Error: 500 - Internal Server Error/)).toBeInTheDocument();
    });

    it('should handle Unicode characters', () => {
      render(<EmptyState title="没有结果" description="尝试其他搜索词" />);

      expect(screen.getByText('没有结果')).toBeInTheDocument();
      expect(screen.getByText('尝试其他搜索词')).toBeInTheDocument();
    });
  });
});
