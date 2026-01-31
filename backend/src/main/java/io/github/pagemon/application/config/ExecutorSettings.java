package io.github.pagemon.application.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "monitor.executor")
public record ExecutorSettings(
    int corePoolSize,
    int maxPoolSize,
    int queueCapacity
) {
    public ExecutorSettings {
        if (corePoolSize <= 0) {
            throw new IllegalArgumentException("corePoolSize must be positive");
        }
        if (maxPoolSize < corePoolSize) {
            throw new IllegalArgumentException("maxPoolSize must be >= corePoolSize");
        }
        if (queueCapacity < 0) {
            throw new IllegalArgumentException("queueCapacity must be non-negative");
        }
    }

    public ExecutorSettings() {
        this(4, 10, 50);
    }
}
