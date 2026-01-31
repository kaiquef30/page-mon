package io.github.pagemon.infrastructure.lock;

import io.github.pagemon.application.ports.LockPort;
import io.github.pagemon.infrastructure.logging.LoggingContext;
import io.github.pagemon.infrastructure.logging.StructuredLogger;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import java.util.concurrent.TimeUnit;

public class RedissonLockPort implements LockPort {

    private static final StructuredLogger log = StructuredLogger.forClass(RedissonLockPort.class);

    private final RedissonClient redisson;
    private final LockSettings settings;

    public RedissonLockPort(RedissonClient redisson, LockSettings settings) {
        this.redisson = redisson;
        this.settings = settings;
    }

    @Override
    public LockHandle tryAcquire(String key) {
        String fullKey = settings.keyPrefix() + ":" + key;
        RLock lock = settings.fair() ? redisson.getFairLock(fullKey) : redisson.getLock(fullKey);

        long startTime = System.currentTimeMillis();
        boolean acquired;

        try {
            acquired = lock.tryLock(
                    settings.waitTime().toMillis(),
                    settings.leaseTime().toMillis(),
                    TimeUnit.MILLISECONDS
            );

            long duration = System.currentTimeMillis() - startTime;

            if (acquired) {
                log.debug()
                    .message("Lock acquired")
                    .component("RedissonLockPort")
                    .operation("acquire_lock")
                    .field("lockKey", fullKey)
                    .field("fair", settings.fair())
                    .field("waitTimeMs", settings.waitTime().toMillis())
                    .field("leaseTimeMs", settings.leaseTime().toMillis())
                    .duration(duration)
                    .status("acquired")
                    .log();
            } else {
                log.debug()
                    .message("Failed to acquire lock (timeout or already acquired)")
                    .component("RedissonLockPort")
                    .operation("acquire_lock")
                    .field("lockKey", fullKey)
                    .field("waitTimeMs", settings.waitTime().toMillis())
                    .duration(duration)
                    .status("not_acquired")
                    .log();
            }

        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();

            log.warn()
                .message("Thread interrupted during lock acquisition")
                .component("RedissonLockPort")
                .operation("acquire_lock")
                .field("lockKey", fullKey)
                .exception(ie)
                .status("interrupted")
                .log();

            acquired = false;
        } catch (Exception e) {
            log.error()
                .message("Error acquiring lock")
                .component("RedissonLockPort")
                .operation("acquire_lock")
                .field("lockKey", fullKey)
                .exception(e)
                .status("error")
                .log();

            acquired = false;
        }

        final boolean finalAcquired = acquired;
        final String lockKey = fullKey;

        return new LockHandle() {
            @Override public boolean acquired() { return finalAcquired; }

            @Override public void close() {
                if (!finalAcquired) return;

                try {
                    if (lock.isHeldByCurrentThread()) {
                        lock.unlock();

                        log.debug()
                            .message("Lock released")
                            .component("RedissonLockPort")
                            .operation("release_lock")
                            .field("lockKey", lockKey)
                            .status("released")
                            .log();

                    } else {
                        log.warn()
                            .message("Lock not held by current thread (lease expired?)")
                            .component("RedissonLockPort")
                            .operation("release_lock")
                            .field("lockKey", lockKey)
                            .status("not_held")
                            .log();
                    }
                } catch (Exception e) {
                    log.error()
                        .message("Error releasing lock")
                        .component("RedissonLockPort")
                        .operation("release_lock")
                        .field("lockKey", lockKey)
                        .exception(e)
                        .status("error")
                        .log();
                }
            }
        };
    }
}
