package io.github.pagemon.infrastructure.persistence;

import io.github.pagemon.domain.ChangeEvent;
import io.github.pagemon.domain.Snapshot;
import io.github.pagemon.domain.WatchTarget;

import java.net.URI;
import java.time.Duration;

public final class Mapper {
  private Mapper() {}

  public static WatchTarget toDomain(WatchTargetEntity e) {
    return new WatchTarget(
        e.getId(),
        e.getName(),
        URI.create(e.getUrl()),
        e.isEnabled(),
        e.getFetchMode(),
        e.getCssSelector(),
        e.getIgnoreRegexes() == null ? java.util.List.of() : java.util.List.copyOf(e.getIgnoreRegexes()),
        Duration.ofSeconds(e.getIntervalSeconds()),
        e.getNextRunAt(),
        e.getLastRunAt(),
        e.getLastStatus(),
        e.getLastError()
    );
  }

  public static WatchTargetEntity toEntity(WatchTarget d) {
    WatchTargetEntity e = new WatchTargetEntity();
    e.setId(d.id());
    e.setName(d.name());
    e.setUrl(d.url().toString());
    e.setEnabled(d.enabled());
    e.setFetchMode(d.fetchMode());
    e.setCssSelector(d.cssSelector());
    e.setIgnoreRegexes(d.ignoreRegexes());
    e.setIntervalSeconds(d.interval().toSeconds());
    e.setNextRunAt(d.nextRunAt());
    e.setLastRunAt(d.lastRunAt());
    e.setLastStatus(d.lastStatus());
    e.setLastError(d.lastError());
    return e;
  }

  public static Snapshot toDomain(SnapshotEntity e) {
    return new Snapshot(
        e.getId(),
        e.getTargetId(),
        e.getFetchedAt(),
        e.getHttpStatus(),
        e.getEtag(),
        e.getLastModified(),
        e.getContentHash(),
        e.getNormalizedText(),
        e.getRawHtml()
    );
  }

  public static SnapshotEntity toEntity(Snapshot d) {
    SnapshotEntity e = new SnapshotEntity();
    e.setId(d.id());
    e.setTargetId(d.targetId());
    e.setFetchedAt(d.fetchedAt());
    e.setHttpStatus(d.httpStatus());
    e.setEtag(d.etag());
    e.setLastModified(d.lastModified());
    e.setContentHash(d.contentHashSha256());
    e.setNormalizedText(d.normalizedText());
    e.setRawHtml(d.rawHtml());
    return e;
  }

  public static ChangeEvent toDomain(ChangeEventEntity e) {
    return new ChangeEvent(
        e.getId(),
        e.getTargetId(),
        e.getCreatedAt(),
        e.getOldSnapshotId(),
        e.getNewSnapshotId(),
        e.getAddedLines(),
        e.getRemovedLines(),
        e.getUnifiedDiff()
    );
  }

  public static ChangeEventEntity toEntity(ChangeEvent d) {
    ChangeEventEntity e = new ChangeEventEntity();
    e.setId(d.id());
    e.setTargetId(d.targetId());
    e.setCreatedAt(d.createdAt());
    e.setOldSnapshotId(d.oldSnapshotId());
    e.setNewSnapshotId(d.newSnapshotId());
    e.setAddedLines(d.addedLines());
    e.setRemovedLines(d.removedLines());
    e.setUnifiedDiff(d.unifiedDiff());
    return e;
  }
}
