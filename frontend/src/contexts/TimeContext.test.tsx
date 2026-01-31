import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TimeProvider, useTime } from './TimeContext';

describe('TimeProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render children', () => {
    render(
      <TimeProvider>
        <div>Test Content</div>
      </TimeProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should provide initial time context', () => {
    function TestComponent() {
      const { currentTime, tick } = useTime();
      return (
        <div>
          <div data-testid="tick">{tick}</div>
          <div data-testid="time">{currentTime.toISOString()}</div>
        </div>
      );
    }

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    expect(screen.getByTestId('tick')).toHaveTextContent('0');
    expect(screen.getByTestId('time')).toBeInTheDocument();
  });

  it('should increment tick every second', async () => {
    function TestComponent() {
      const { tick } = useTime();
      return <div data-testid="tick">{tick}</div>;
    }

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    expect(screen.getByTestId('tick')).toHaveTextContent('0');

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('tick')).toHaveTextContent('1');
    });

    // Advance time by another second
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('tick')).toHaveTextContent('2');
    });
  });

  it('should update currentTime every second', async () => {
    function TestComponent() {
      const { currentTime } = useTime();
      return <div data-testid="time">{currentTime.getTime()}</div>;
    }

    const startTime = new Date('2024-01-01T00:00:00Z');
    vi.setSystemTime(startTime);

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    const initialTime = screen.getByTestId('time').textContent;

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const newTime = screen.getByTestId('time').textContent;
      expect(newTime).not.toBe(initialTime);
    });
  });

  it('should share same tick across multiple components', async () => {
    function TickDisplay({ id }: { id: string }) {
      const { tick } = useTime();
      return <div data-testid={`tick-${id}`}>{tick}</div>;
    }

    render(
      <TimeProvider>
        <TickDisplay id="1" />
        <TickDisplay id="2" />
        <TickDisplay id="3" />
      </TimeProvider>
    );

    expect(screen.getByTestId('tick-1')).toHaveTextContent('0');
    expect(screen.getByTestId('tick-2')).toHaveTextContent('0');
    expect(screen.getByTestId('tick-3')).toHaveTextContent('0');

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('tick-1')).toHaveTextContent('1');
      expect(screen.getByTestId('tick-2')).toHaveTextContent('1');
      expect(screen.getByTestId('tick-3')).toHaveTextContent('1');
    });
  });

  it('should clean up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(
      <TimeProvider>
        <div>Test</div>
      </TimeProvider>
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should create only one interval', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    render(
      <TimeProvider>
        <div>Test 1</div>
        <div>Test 2</div>
        <div>Test 3</div>
      </TimeProvider>
    );

    // Should only create one interval despite multiple children
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it('should handle rapid time advances', async () => {
    function TestComponent() {
      const { tick } = useTime();
      return <div data-testid="tick">{tick}</div>;
    }

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    expect(screen.getByTestId('tick')).toHaveTextContent('0');

    // Advance time by 10 seconds rapidly
    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(screen.getByTestId('tick')).toHaveTextContent('10');
    });
  });

  it('should provide accurate currentTime', async () => {
    function TestComponent() {
      const { currentTime } = useTime();
      return (
        <div data-testid="time">
          {currentTime.getHours()}:{currentTime.getMinutes()}:{currentTime.getSeconds()}
        </div>
      );
    }

    const startTime = new Date('2024-01-01T12:30:45Z');
    vi.setSystemTime(startTime);

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    // Initial time should be close to start time
    const timeText = screen.getByTestId('time').textContent;
    expect(timeText).toContain('12');
    expect(timeText).toContain('30');
  });

  it('should handle multiple re-renders efficiently', async () => {
    let renderCount = 0;

    function TestComponent() {
      const { tick } = useTime();
      renderCount++;
      return <div data-testid="tick">{tick}</div>;
    }

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    const initialRenderCount = renderCount;

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('tick')).toHaveTextContent('1');
    });

    // Should only re-render once per tick
    expect(renderCount).toBe(initialRenderCount + 1);
  });
});

describe('useTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should throw error when used outside TimeProvider', () => {
    function TestComponent() {
      useTime();
      return <div>Test</div>;
    }

    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTime must be used within TimeProvider');

    consoleError.mockRestore();
  });

  it('should return currentTime and tick', () => {
    function TestComponent() {
      const context = useTime();
      return (
        <div>
          <div data-testid="has-current-time">{context.currentTime ? 'yes' : 'no'}</div>
          <div data-testid="has-tick">{typeof context.tick === 'number' ? 'yes' : 'no'}</div>
        </div>
      );
    }

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    expect(screen.getByTestId('has-current-time')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-tick')).toHaveTextContent('yes');
  });

  it('should return Date object for currentTime', () => {
    function TestComponent() {
      const { currentTime } = useTime();
      return (
        <div data-testid="is-date">{currentTime instanceof Date ? 'yes' : 'no'}</div>
      );
    }

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    expect(screen.getByTestId('is-date')).toHaveTextContent('yes');
  });

  it('should return number for tick', () => {
    function TestComponent() {
      const { tick } = useTime();
      return <div data-testid="tick-type">{typeof tick}</div>;
    }

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    expect(screen.getByTestId('tick-type')).toHaveTextContent('number');
  });
});

describe('TimeContext performance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should prevent multiple intervals with many consumers', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    function Consumer() {
      const { tick } = useTime();
      return <div>{tick}</div>;
    }

    render(
      <TimeProvider>
        {Array.from({ length: 50 }).map((_, i) => (
          <Consumer key={i} />
        ))}
      </TimeProvider>
    );

    // Should still only create one interval for 50 consumers
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it('should update all consumers with single interval', async () => {
    function Consumer({ id }: { id: number }) {
      const { tick } = useTime();
      return <div data-testid={`consumer-${id}`}>{tick}</div>;
    }

    render(
      <TimeProvider>
        {Array.from({ length: 10 }).map((_, i) => (
          <Consumer key={i} id={i} />
        ))}
      </TimeProvider>
    );

    // All should start at 0
    for (let i = 0; i < 10; i++) {
      expect(screen.getByTestId(`consumer-${i}`)).toHaveTextContent('0');
    }

    vi.advanceTimersByTime(1000);

    // All should update to 1 together
    await waitFor(() => {
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`consumer-${i}`)).toHaveTextContent('1');
      }
    });
  });
});

describe('TimeContext edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should handle component mounting after provider starts', async () => {
    function TestComponent() {
      const { tick } = useTime();
      return <div data-testid="tick">{tick}</div>;
    }

    function DelayedMount() {
      const [show, setShow] = React.useState(false);

      React.useEffect(() => {
        const timer = setTimeout(() => setShow(true), 500);
        return () => clearTimeout(timer);
      }, []);

      return show ? <TestComponent /> : null;
    }

    render(
      <TimeProvider>
        <DelayedMount />
      </TimeProvider>
    );

    // Wait for component to mount
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByTestId('tick')).toBeInTheDocument();
    });

    // Component should get current tick value
    expect(screen.getByTestId('tick')).toHaveTextContent('0');

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('tick')).toHaveTextContent('1');
    });
  });

  it('should handle component unmounting', async () => {
    function TestComponent({ id }: { id: string }) {
      const { tick } = useTime();
      return <div data-testid={`tick-${id}`}>{tick}</div>;
    }

    function DynamicComponents() {
      const [count, setCount] = React.useState(3);

      React.useEffect(() => {
        const timer = setTimeout(() => setCount(1), 1000);
        return () => clearTimeout(timer);
      }, []);

      return (
        <>
          {Array.from({ length: count }).map((_, i) => (
            <TestComponent key={i} id={String(i)} />
          ))}
        </>
      );
    }

    render(
      <TimeProvider>
        <DynamicComponents />
      </TimeProvider>
    );

    expect(screen.getByTestId('tick-0')).toBeInTheDocument();
    expect(screen.getByTestId('tick-1')).toBeInTheDocument();
    expect(screen.getByTestId('tick-2')).toBeInTheDocument();

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.queryByTestId('tick-2')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('tick-0')).toBeInTheDocument();
  });

  it('should maintain tick accuracy over long periods', async () => {
    function TestComponent() {
      const { tick } = useTime();
      return <div data-testid="tick">{tick}</div>;
    }

    render(
      <TimeProvider>
        <TestComponent />
      </TimeProvider>
    );

    // Simulate 1 minute passing
    vi.advanceTimersByTime(60000);

    await waitFor(() => {
      expect(screen.getByTestId('tick')).toHaveTextContent('60');
    });
  });
});
