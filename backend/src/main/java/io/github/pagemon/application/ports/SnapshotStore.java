package io.github.pagemon.application.ports;

import io.github.pagemon.domain.Snapshot;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface SnapshotStore {
  Snapshot save(Snapshot snapshot);
  Optional<Snapshot> findLatestByTargetId(UUID targetId);
  Optional<Snapshot> findById(UUID id);
  List<Snapshot> findByTargetId(UUID targetId, int limit);
  Map<UUID, Snapshot> findLatestByTargetIds(List<UUID> targetIds);

  void deleteByTargetId(UUID targetId);
}
