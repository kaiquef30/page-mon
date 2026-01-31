package io.github.pagemon.interfaces.config;

import io.github.pagemon.application.ports.LockPort;
import io.github.pagemon.infrastructure.lock.LockSettings;
import io.github.pagemon.infrastructure.lock.RedissonLockPort;
import org.redisson.api.RedissonClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(LockSettings.class)
public class LockConfig {

    @Bean
    @ConditionalOnProperty(prefix = "monitor.lock", name = "enabled", havingValue = "true")
    public LockPort redissonLockPort(RedissonClient redisson, LockSettings settings) {
        return new RedissonLockPort(redisson, settings);
    }

    @Bean
    @ConditionalOnMissingBean(LockPort.class)
    public LockPort noopLockPort() {
        return LockPort.noop();
    }
}
