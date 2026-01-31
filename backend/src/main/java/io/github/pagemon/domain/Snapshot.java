package io.github.pagemon.domain;

import java.time.Instant;
import java.util.UUID;

public record Snapshot(
    UUID id,
    UUID targetId,
    Instant fetchedAt,
    Integer httpStatus,
    String etag,
    String lastModified,
    String contentHashSha256,
    String normalizedText,
    String rawHtml
) {}