package io.github.pagemon.interfaces.api.dto;

import io.github.pagemon.domain.ChangeEvent;

import java.time.Instant;
import java.util.UUID;

public final class ChangeDtos {
  private ChangeDtos() {}

  public record Response(
      UUID id,
      UUID targetId,
      Instant createdAt,
      UUID oldSnapshotId,
      UUID newSnapshotId,
      int addedLines,
      int removedLines,
      String unifiedDiff
  ) {
    public static Response fromDomain(ChangeEvent e) {
      return new Response(
          e.id(), e.targetId(), e.createdAt(), e.oldSnapshotId(), e.newSnapshotId(),
          e.addedLines(), e.removedLines(), e.unifiedDiff()
      );
    }
  }
}
