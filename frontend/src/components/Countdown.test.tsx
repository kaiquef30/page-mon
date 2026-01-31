import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Countdown, RelativeTime } from './Countdown';
import { TimeProvider } from '@/contexts/TimeContext';
import { addSeconds, addMinutes, addHours, subSeconds, subMinutes, subHours } from 'date-fns';

function renderWithTimeProvider(ui: React.ReactElement) {
  return render(<TimeProvider>{ui}</TimeProvider>);
}

describe('Countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('rendering with future dates', () => {
    it('should display countdown for future date', () => {
      const futureDate = addMinutes(new Date(), 5);

      renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      expect(screen.getByText(/5 minutes/)).toBeInTheDocument();
    });

    it('should display countdown in seconds for very near future', () => {
      const futureDate = addSeconds(new Date(), 30);

      renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      expect(screen.getByText(/30 seconds|less than a minute/)).toBeInTheDocument();
    });

    it('should display countdown in minutes', () => {
      const futureDate = addMinutes(new Date(), 15);

      renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      expect(screen.getByText(/15 minutes/)).toBeInTheDocument();
    });

    it('should display countdown in hours', () => {
      const futureDate = addHours(new Date(), 2);

      renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      expect(screen.getByText(/2 hours|about 2 hours/)).toBeInTheDocument();
    });

    it('should accept string date format', () => {
      const futureDate = addMinutes(new Date(), 10);

      renderWithTimeProvider(<Countdown targetDate={futureDate.toISOString()} />);

      expect(screen.getByText(/10 minutes/)).toBeInTheDocument();
    });

    it('should accept Date object', () => {
      const futureDate = addMinutes(new Date(), 10);

      renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      expect(screen.getByText(/10 minutes/)).toBeInTheDocument();
    });
  });

  describe('rendering overdue dates', () => {
    it('should display "Due now" for past dates', () => {
      const pastDate = subMinutes(new Date(), 5);

      renderWithTimeProvider(<Countdown targetDate={pastDate} />);

      expect(screen.getByText('Due now')).toBeInTheDocument();
    });

    it('should apply warning styling for overdue', () => {
      const pastDate = subMinutes(new Date(), 5);

      const { container } = renderWithTimeProvider(<Countdown targetDate={pastDate} />);

      const countdown = container.querySelector('.text-warning');
      expect(countdown).toBeInTheDocument();
    });

    it('should apply font-medium class for overdue', () => {
      const pastDate = subMinutes(new Date(), 5);

      const { container } = renderWithTimeProvider(<Countdown targetDate={pastDate} />);

      const countdown = container.querySelector('.font-medium');
      expect(countdown).toBeInTheDocument();
    });

    it('should hide overdue when showOverdue is false', () => {
      const pastDate = subMinutes(new Date(), 5);

      renderWithTimeProvider(<Countdown targetDate={pastDate} showOverdue={false} />);

      expect(screen.queryByText('Due now')).not.toBeInTheDocument();
    });
  });

  describe('null and undefined handling', () => {
    it('should display dash for null date', () => {
      renderWithTimeProvider(<Countdown targetDate={null} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should display dash for undefined date', () => {
      renderWithTimeProvider(<Countdown targetDate={undefined} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should apply muted styling for null date', () => {
      const { container } = renderWithTimeProvider(<Countdown targetDate={null} />);

      const countdown = container.querySelector('.text-muted-foreground');
      expect(countdown).toBeInTheDocument();
    });
  });

  describe('urgency color coding', () => {
    it('should apply warning color for less than 1 minute', () => {
      const futureDate = addSeconds(new Date(), 30);

      const { container } = renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      const countdown = container.querySelector('.text-warning');
      expect(countdown).toBeInTheDocument();
    });

    it('should apply warning/80 color for less than 5 minutes', () => {
      const futureDate = addMinutes(new Date(), 3);

      const { container } = renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      const countdown = container.querySelector('.text-warning\\/80');
      expect(countdown).toBeInTheDocument();
    });

    it('should apply muted color for more than 5 minutes', () => {
      const futureDate = addMinutes(new Date(), 10);

      const { container } = renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      const countdown = container.querySelector('.text-muted-foreground');
      expect(countdown).toBeInTheDocument();
    });

    it('should transition color as time approaches', async () => {
      const futureDate = addMinutes(new Date(), 6);

      const { container } = renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      expect(container.querySelector('.text-muted-foreground')).toBeInTheDocument();

      // Advance time by 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);

      await waitFor(() => {
        expect(container.querySelector('.text-warning\\/80')).toBeInTheDocument();
      });
    });
  });

  describe('onDue callback', () => {
    it('should call onDue when countdown reaches zero', async () => {
      const onDue = vi.fn();
      const futureDate = addSeconds(new Date(), 3);

      renderWithTimeProvider(<Countdown targetDate={futureDate} onDue={onDue} />);

      expect(onDue).not.toHaveBeenCalled();

      // Advance time past the due date
      vi.advanceTimersByTime(5 * 1000);

      await waitFor(() => {
        expect(onDue).toHaveBeenCalled();
      });
    });

    it('should call onDue for already past dates', () => {
      const onDue = vi.fn();
      const pastDate = subSeconds(new Date(), 5);

      renderWithTimeProvider(<Countdown targetDate={pastDate} onDue={onDue} />);

      expect(onDue).toHaveBeenCalled();
    });

    it('should not call onDue when not provided', async () => {
      const futureDate = addSeconds(new Date(), 2);

      renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      vi.advanceTimersByTime(3 * 1000);

      // Should not throw error
      expect(screen.getByText('Due now')).toBeInTheDocument();
    });

    it('should call onDue only once', async () => {
      const onDue = vi.fn();
      const futureDate = addSeconds(new Date(), 2);

      renderWithTimeProvider(<Countdown targetDate={futureDate} onDue={onDue} />);

      vi.advanceTimersByTime(3 * 1000);

      await waitFor(() => {
        expect(onDue).toHaveBeenCalledTimes(1);
      });

      // Advance more time
      vi.advanceTimersByTime(2 * 1000);

      // Should still be called only once
      expect(onDue).toHaveBeenCalledTimes(1);
    });
  });

  describe('live updates', () => {
    it('should update countdown every second', async () => {
      const futureDate = addSeconds(new Date(), 10);

      renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      expect(screen.getByText(/10 seconds|less than a minute/)).toBeInTheDocument();

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText(/9 seconds|less than a minute/)).toBeInTheDocument();
      });
    });

    it('should update from minutes to seconds', async () => {
      const futureDate = addSeconds(new Date(), 61);

      renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      expect(screen.getByText(/1 minute|about 1 minute/)).toBeInTheDocument();

      vi.advanceTimersByTime(10 * 1000);

      await waitFor(() => {
        expect(screen.getByText(/51 seconds|less than a minute/)).toBeInTheDocument();
      });
    });

    it('should update to "Due now" when time expires', async () => {
      const futureDate = addSeconds(new Date(), 2);

      renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      expect(screen.queryByText('Due now')).not.toBeInTheDocument();

      vi.advanceTimersByTime(3 * 1000);

      await waitFor(() => {
        expect(screen.getByText('Due now')).toBeInTheDocument();
      });
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const futureDate = addMinutes(new Date(), 5);

      const { container } = renderWithTimeProvider(
        <Countdown targetDate={futureDate} className="custom-countdown" />
      );

      const countdown = container.querySelector('.custom-countdown');
      expect(countdown).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      const futureDate = addMinutes(new Date(), 10);

      const { container } = renderWithTimeProvider(
        <Countdown targetDate={futureDate} className="custom-class" />
      );

      const countdown = container.querySelector('.custom-class');
      expect(countdown).toHaveClass('tabular-nums', 'text-muted-foreground', 'custom-class');
    });
  });

  describe('tabular-nums styling', () => {
    it('should apply tabular-nums for consistent width', () => {
      const futureDate = addMinutes(new Date(), 5);

      const { container } = renderWithTimeProvider(<Countdown targetDate={futureDate} />);

      const countdown = container.querySelector('.tabular-nums');
      expect(countdown).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle invalid date strings', () => {
      renderWithTimeProvider(<Countdown targetDate="invalid-date" />);

      // Invalid dates should be treated as null
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should handle very far future dates', () => {
      const farFuture = new Date('2099-12-31');

      renderWithTimeProvider(<Countdown targetDate={farFuture} />);

      expect(screen.getByText(/years/)).toBeInTheDocument();
    });

    it('should handle dates exactly at current time', () => {
      const now = new Date();

      renderWithTimeProvider(<Countdown targetDate={now} />);

      expect(screen.getByText('Due now')).toBeInTheDocument();
    });

    it('should handle timezone differences', () => {
      const date = new Date('2099-01-01T12:00:00Z');

      renderWithTimeProvider(<Countdown targetDate={date} />);

      // Should handle UTC dates correctly
      const countdown = screen.queryByText('—');
      expect(countdown).not.toBeInTheDocument();
    });
  });

  describe('showOverdue prop', () => {
    it('should show overdue by default', () => {
      const pastDate = subMinutes(new Date(), 10);

      renderWithTimeProvider(<Countdown targetDate={pastDate} />);

      expect(screen.getByText('Due now')).toBeInTheDocument();
    });

    it('should respect showOverdue=true', () => {
      const pastDate = subMinutes(new Date(), 10);

      renderWithTimeProvider(<Countdown targetDate={pastDate} showOverdue={true} />);

      expect(screen.getByText('Due now')).toBeInTheDocument();
    });

    it('should hide overdue when showOverdue=false', () => {
      const pastDate = subMinutes(new Date(), 10);

      renderWithTimeProvider(<Countdown targetDate={pastDate} showOverdue={false} />);

      expect(screen.queryByText('Due now')).not.toBeInTheDocument();
    });
  });
});

describe('RelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('rendering past dates', () => {
    it('should display relative time for past dates', () => {
      const pastDate = subMinutes(new Date(), 5);

      renderWithTimeProvider(<RelativeTime date={pastDate} />);

      expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
    });

    it('should display "ago" suffix', () => {
      const pastDate = subHours(new Date(), 2);

      renderWithTimeProvider(<RelativeTime date={pastDate} />);

      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    it('should accept string date format', () => {
      const pastDate = subMinutes(new Date(), 10);

      renderWithTimeProvider(<RelativeTime date={pastDate.toISOString()} />);

      expect(screen.getByText(/10 minutes ago/)).toBeInTheDocument();
    });

    it('should accept Date object', () => {
      const pastDate = subMinutes(new Date(), 10);

      renderWithTimeProvider(<RelativeTime date={pastDate} />);

      expect(screen.getByText(/10 minutes ago/)).toBeInTheDocument();
    });
  });

  describe('rendering future dates', () => {
    it('should display relative time for future dates', () => {
      const futureDate = addMinutes(new Date(), 5);

      renderWithTimeProvider(<RelativeTime date={futureDate} />);

      expect(screen.getByText(/in 5 minutes/)).toBeInTheDocument();
    });
  });

  describe('null and undefined handling', () => {
    it('should display dash for null date', () => {
      renderWithTimeProvider(<RelativeTime date={null} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should display dash for undefined date', () => {
      renderWithTimeProvider(<RelativeTime date={undefined} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should apply muted styling for null date', () => {
      const { container } = renderWithTimeProvider(<RelativeTime date={null} />);

      const time = container.querySelector('.text-muted-foreground');
      expect(time).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const pastDate = subMinutes(new Date(), 5);

      const { container } = renderWithTimeProvider(
        <RelativeTime date={pastDate} className="custom-time" />
      );

      const time = container.querySelector('.custom-time');
      expect(time).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      const pastDate = subMinutes(new Date(), 5);

      const { container } = renderWithTimeProvider(
        <RelativeTime date={pastDate} className="custom-class" />
      );

      const time = container.querySelector('.custom-class');
      expect(time).toHaveClass('text-muted-foreground', 'custom-class');
    });
  });

  describe('live updates', () => {
    it('should update relative time periodically', async () => {
      const pastDate = subMinutes(new Date(), 5);

      renderWithTimeProvider(<RelativeTime date={pastDate} />);

      expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();

      // Advance time by 60 seconds (one minute tick)
      vi.advanceTimersByTime(60 * 1000);

      await waitFor(() => {
        expect(screen.getByText(/6 minutes ago/)).toBeInTheDocument();
      });
    });

    it('should not update on every second for performance', async () => {
      const pastDate = subMinutes(new Date(), 5);

      renderWithTimeProvider(<RelativeTime date={pastDate} />);

      const initialText = screen.getByText(/5 minutes ago/);

      // Advance by 30 seconds (should not update yet)
      vi.advanceTimersByTime(30 * 1000);

      // Should still show same text
      expect(initialText).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('should format seconds correctly', () => {
      const pastDate = subSeconds(new Date(), 30);

      renderWithTimeProvider(<RelativeTime date={pastDate} />);

      expect(screen.getByText(/less than a minute ago|30 seconds ago/)).toBeInTheDocument();
    });

    it('should format minutes correctly', () => {
      const pastDate = subMinutes(new Date(), 15);

      renderWithTimeProvider(<RelativeTime date={pastDate} />);

      expect(screen.getByText(/15 minutes ago/)).toBeInTheDocument();
    });

    it('should format hours correctly', () => {
      const pastDate = subHours(new Date(), 3);

      renderWithTimeProvider(<RelativeTime date={pastDate} />);

      expect(screen.getByText(/3 hours ago|about 3 hours ago/)).toBeInTheDocument();
    });

    it('should format days correctly', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      renderWithTimeProvider(<RelativeTime date={pastDate} />);

      expect(screen.getByText(/2 days ago/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle invalid date strings', () => {
      renderWithTimeProvider(<RelativeTime date="invalid-date" />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should handle very old dates', () => {
      const veryOld = new Date('1990-01-01');

      renderWithTimeProvider(<RelativeTime date={veryOld} />);

      expect(screen.getByText(/years ago/)).toBeInTheDocument();
    });

    it('should handle current time', () => {
      const now = new Date();

      renderWithTimeProvider(<RelativeTime date={now} />);

      expect(screen.getByText(/less than a minute ago|few seconds ago/)).toBeInTheDocument();
    });

    it('should handle timezone differences', () => {
      const date = new Date('2020-01-01T12:00:00Z');

      renderWithTimeProvider(<RelativeTime date={date} />);

      // Should handle UTC dates correctly
      const time = screen.queryByText('—');
      expect(time).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply muted-foreground color', () => {
      const pastDate = subMinutes(new Date(), 5);

      const { container } = renderWithTimeProvider(<RelativeTime date={pastDate} />);

      const time = container.querySelector('.text-muted-foreground');
      expect(time).toBeInTheDocument();
    });
  });
});

describe('TimeProvider integration', () => {
  it('should throw error when Countdown used without TimeProvider', () => {
    const futureDate = addMinutes(new Date(), 5);

    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<Countdown targetDate={futureDate} />);
    }).toThrow('useTime must be used within TimeProvider');

    consoleError.mockRestore();
  });

  it('should throw error when RelativeTime used without TimeProvider', () => {
    const pastDate = subMinutes(new Date(), 5);

    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<RelativeTime date={pastDate} />);
    }).toThrow('useTime must be used within TimeProvider');

    consoleError.mockRestore();
  });

  it('should share time context across multiple Countdown components', () => {
    const date1 = addMinutes(new Date(), 5);
    const date2 = addMinutes(new Date(), 10);

    renderWithTimeProvider(
      <>
        <Countdown targetDate={date1} />
        <Countdown targetDate={date2} />
      </>
    );

    expect(screen.getByText(/5 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/10 minutes/)).toBeInTheDocument();
  });

  it('should share time context across Countdown and RelativeTime', () => {
    const futureDate = addMinutes(new Date(), 5);
    const pastDate = subMinutes(new Date(), 5);

    renderWithTimeProvider(
      <>
        <Countdown targetDate={futureDate} />
        <RelativeTime date={pastDate} />
      </>
    );

    expect(screen.getByText(/5 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
  });
});
