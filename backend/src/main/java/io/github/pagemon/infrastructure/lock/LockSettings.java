package io.github.pagemon.infrastructure.lock;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "monitor.lock")
public record LockSettings(
        boolean enabled,
        String keyPrefix,
        Duration waitTime,
        Duration leaseTime,
        boolean fair
) {
    public LockSettings {
        if (keyPrefix == null || keyPrefix.isBlank()) keyPrefix = "pagemon";
        if (waitTime == null) waitTime = Duration.ZERO;
        if (leaseTime == null) leaseTime = Duration.ofMinutes(3);
    }
}
