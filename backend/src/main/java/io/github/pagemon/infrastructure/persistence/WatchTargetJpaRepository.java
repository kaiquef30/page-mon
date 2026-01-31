package io.github.pagemon.infrastructure.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface WatchTargetJpaRepository extends JpaRepository<WatchTargetEntity, UUID> {

  @Query("select t from WatchTargetEntity t " +
         "where t.enabled = true and (t.nextRunAt is null or t.nextRunAt <= :now) " +
         "order by t.nextRunAt asc nulls first")
  List<WatchTargetEntity> findDue(Instant now, Pageable pageable);
}
