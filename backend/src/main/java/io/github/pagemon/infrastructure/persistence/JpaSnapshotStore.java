package io.github.pagemon.infrastructure.persistence;

import io.github.pagemon.application.ports.SnapshotStore;
import io.github.pagemon.domain.Snapshot;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@Transactional
public class JpaSnapshotStore implements SnapshotStore {

  private final SnapshotJpaRepository jpa;

  public JpaSnapshotStore(SnapshotJpaRepository jpa) {
    this.jpa = jpa;
  }

  @Override
  public Snapshot save(Snapshot snapshot) {
    var saved = jpa.save(Mapper.toEntity(snapshot));
    return Mapper.toDomain(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Snapshot> findLatestByTargetId(UUID targetId) {
    return jpa.findLatest(targetId, PageRequest.of(0, 1)).stream().findFirst().map(Mapper::toDomain);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Snapshot> findById(UUID id) {
    return jpa.findById(id).map(Mapper::toDomain);
  }

  @Override
  @Transactional(readOnly = true)
  public List<Snapshot> findByTargetId(UUID targetId, int limit) {
    return jpa.findByTargetId(targetId, PageRequest.of(0, Math.max(1, limit))).stream().map(Mapper::toDomain).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public Map<UUID, Snapshot> findLatestByTargetIds(List<UUID> targetIds) {
    if (targetIds == null || targetIds.isEmpty()) {
      return Map.of();
    }
    return jpa.findLatestByTargetIds(targetIds).stream()
        .map(Mapper::toDomain)
        .collect(Collectors.toMap(Snapshot::targetId, snapshot -> snapshot));
  }

  @Override
  public void deleteByTargetId(UUID targetId) {
    jpa.deleteByTargetId(targetId);
  }
}
