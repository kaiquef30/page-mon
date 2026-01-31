package io.github.pagemon.interfaces.api.dto;

import io.github.pagemon.domain.FetchMode;
import io.github.pagemon.domain.WatchTarget;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class TargetDtos {
  private TargetDtos() {}

  public record CreateRequest(
      @NotBlank String name,
      @NotNull URI url,
      Boolean enabled,
      FetchMode fetchMode,
      String cssSelector,
      List<String> ignoreRegexes,
      @Positive Long intervalSeconds
  ) {}

  public record PatchRequest(
      String name,
      URI url,
      Boolean enabled,
      FetchMode fetchMode,
      String cssSelector,
      List<String> ignoreRegexes,
      Long intervalSeconds
  ) {}

  public record Response(
      UUID id,
      String name,
      URI url,
      boolean enabled,
      FetchMode fetchMode,
      String cssSelector,
      List<String> ignoreRegexes,
      long intervalSeconds,
      Instant nextRunAt,
      Instant lastRunAt,
      String lastStatus,
      String lastError
  ) {
    public static Response fromDomain(WatchTarget t) {
      return new Response(
          t.id(), t.name(), t.url(), t.enabled(), t.fetchMode(), t.cssSelector(), t.ignoreRegexes(),
          t.interval().toSeconds(), t.nextRunAt(), t.lastRunAt(),
          t.lastStatus() == null ? null : t.lastStatus().name(),
          t.lastError()
      );
    }
  }
}
