package io.github.pagemon.infrastructure.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ChangeEventJpaRepository extends JpaRepository<ChangeEventEntity, UUID> {

  @Query("select c from ChangeEventEntity c where c.targetId = :targetId order by c.createdAt desc")
  List<ChangeEventEntity> findByTargetId(UUID targetId, Pageable pageable);

  @Query("select c from ChangeEventEntity c order by c.createdAt desc")
  List<ChangeEventEntity> findRecent(Pageable pageable);

  @Modifying
  @Query("delete from ChangeEventEntity c where c.targetId = :targetId")
  void deleteByTargetId(UUID targetId);
}
