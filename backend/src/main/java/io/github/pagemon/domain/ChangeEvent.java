package io.github.pagemon.domain;

import java.time.Instant;
import java.util.UUID;

public record ChangeEvent(
    UUID id,
    UUID targetId,
    Instant createdAt,
    UUID oldSnapshotId,
    UUID newSnapshotId,
    int addedLines,
    int removedLines,
    String unifiedDiff
) {}
