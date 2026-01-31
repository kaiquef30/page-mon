package io.github.pagemon.infrastructure.logging;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

public class MdcExecutorService implements ExecutorService {

    private final ExecutorService delegate;

    public MdcExecutorService(ExecutorService delegate) {
        this.delegate = delegate;
    }

    @Override
    public void execute(Runnable command) {
        delegate.execute(wrap(command));
    }

    @Override
    public void shutdown() {
        delegate.shutdown();
    }

    @Override
    public List<Runnable> shutdownNow() {
        return delegate.shutdownNow();
    }

    @Override
    public boolean isShutdown() {
        return delegate.isShutdown();
    }

    @Override
    public boolean isTerminated() {
        return delegate.isTerminated();
    }

    @Override
    public boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException {
        return delegate.awaitTermination(timeout, unit);
    }

    @Override
    public <T> Future<T> submit(Callable<T> task) {
        return delegate.submit(wrap(task));
    }

    @Override
    public <T> Future<T> submit(Runnable task, T result) {
        return delegate.submit(wrap(task), result);
    }

    @Override
    public Future<?> submit(Runnable task) {
        return delegate.submit(wrap(task));
    }

    @Override
    public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks) throws InterruptedException {
        return delegate.invokeAll(wrapCollection(tasks));
    }

    @Override
    public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit) throws InterruptedException {
        return delegate.invokeAll(wrapCollection(tasks), timeout, unit);
    }

    @Override
    public <T> T invokeAny(Collection<? extends Callable<T>> tasks) throws InterruptedException, ExecutionException {
        return delegate.invokeAny(wrapCollection(tasks));
    }

    @Override
    public <T> T invokeAny(Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
        return delegate.invokeAny(wrapCollection(tasks), timeout, unit);
    }

    private Runnable wrap(Runnable runnable) {
        Map<String, String> context = LoggingContext.getContext();
        return () -> {
            Map<String, String> previous = LoggingContext.getContext();
            try {
                if (context != null) {
                    LoggingContext.setContext(context);
                }
                LoggingContext.put(LoggingContext.THREAD_NAME, Thread.currentThread().getName());
                runnable.run();
            } finally {
                if (previous != null) {
                    LoggingContext.setContext(previous);
                } else {
                    LoggingContext.clear();
                }
            }
        };
    }

    private <T> Callable<T> wrap(Callable<T> callable) {
        Map<String, String> context = LoggingContext.getContext();
        return () -> {
            Map<String, String> previous = LoggingContext.getContext();
            try {
                if (context != null) {
                    LoggingContext.setContext(context);
                }
                LoggingContext.put(LoggingContext.THREAD_NAME, Thread.currentThread().getName());
                return callable.call();
            } finally {
                if (previous != null) {
                    LoggingContext.setContext(previous);
                } else {
                    LoggingContext.clear();
                }
            }
        };
    }

    private <T> Collection<Callable<T>> wrapCollection(Collection<? extends Callable<T>> tasks) {
        return tasks.stream()
                .map(this::wrap)
                .toList();
    }
}
