package io.github.pagemon.infrastructure.lock;

import io.github.pagemon.application.ports.LockPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(LockPort.class)
public class NoopLockPort implements LockPort {
    private final LockPort delegate = LockPort.noop();
    @Override
    public LockHandle tryAcquire(String key) {
        return delegate.tryAcquire(key);
    }
}
