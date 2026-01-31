package io.github.pagemon.domain;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WatchTarget(
    UUID id,
    String name,
    URI url,
    boolean enabled,
    FetchMode fetchMode,
    String cssSelector,
    List<String> ignoreRegexes,
    Duration interval,
    Instant nextRunAt,
    Instant lastRunAt,
    TargetStatus lastStatus,
    String lastError
) {}
