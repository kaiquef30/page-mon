package io.github.pagemon.interfaces.api.dto;

import io.github.pagemon.domain.Snapshot;

import java.time.Instant;
import java.util.UUID;

public final class SnapshotDtos {
  private SnapshotDtos() {}

  public record Response(
      UUID id,
      UUID targetId,
      Instant fetchedAt,
      Integer httpStatus,
      String etag,
      String lastModified,
      String contentHashSha256
  ) {
    public static Response fromDomain(Snapshot s) {
      return new Response(
          s.id(), s.targetId(), s.fetchedAt(), s.httpStatus(), s.etag(), s.lastModified(), s.contentHashSha256()
      );
    }
  }
}
