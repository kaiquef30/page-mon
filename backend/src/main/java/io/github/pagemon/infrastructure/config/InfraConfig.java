package io.github.pagemon.infrastructure.config;

import io.github.pagemon.infrastructure.fetch.FetchSettings;
import io.github.pagemon.infrastructure.lock.LockSettings;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({
    FetchSettings.class,
    LockSettings.class
})
public class InfraConfig {}
