package io.github.pagemon.infrastructure.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SnapshotJpaRepository extends JpaRepository<SnapshotEntity, UUID> {

  @Query("select s from SnapshotEntity s where s.targetId = :targetId order by s.fetchedAt desc")
  List<SnapshotEntity> findLatest(UUID targetId, Pageable pageable);

  @Query("select s from SnapshotEntity s where s.targetId = :targetId order by s.fetchedAt desc")
  List<SnapshotEntity> findByTargetId(UUID targetId, Pageable pageable);

  @Query("""
      SELECT s FROM SnapshotEntity s
      WHERE s.targetId IN :targetIds
      AND s.fetchedAt = (SELECT MAX(s2.fetchedAt) FROM SnapshotEntity s2 WHERE s2.targetId = s.targetId)
      """)
  List<SnapshotEntity> findLatestByTargetIds(@Param("targetIds") List<UUID> targetIds);

  @Modifying
  @Query("delete from SnapshotEntity s where s.targetId = :targetId")
  void deleteByTargetId(UUID targetId);
}
