package io.github.pagemon.infrastructure.fetch;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "monitor.fetch")
public record FetchSettings(
    Duration timeout,
    String userAgent
) {
  public FetchSettings {
    if (timeout == null) timeout = Duration.ofSeconds(20);
    if (userAgent == null || userAgent.isBlank()) {
      userAgent = "page-change-monitor/1.0 (+https://github.com/)";
    }
  }
}
