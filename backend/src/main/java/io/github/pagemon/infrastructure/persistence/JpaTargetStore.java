package io.github.pagemon.infrastructure.persistence;

import io.github.pagemon.application.ports.TargetStore;
import io.github.pagemon.domain.WatchTarget;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static io.github.pagemon.infrastructure.persistence.Mapper.*;

@Repository
@Transactional
public class JpaTargetStore implements TargetStore {

  private final WatchTargetJpaRepository jpa;

  public JpaTargetStore(WatchTargetJpaRepository jpa) {
    this.jpa = jpa;
  }

  @Override
  public WatchTarget save(WatchTarget target) {
    var saved = jpa.save(toEntity(target));
    return toDomain(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<WatchTarget> findById(UUID id) {
    return jpa.findById(id).map(Mapper::toDomain);
  }

  @Override
  @Transactional(readOnly = true)
  public List<WatchTarget> findAll() {
    return jpa.findAll().stream().map(Mapper::toDomain).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<WatchTarget> findDue(Instant now, int limit) {
    return jpa.findDue(now, PageRequest.of(0, Math.max(1, limit))).stream().map(Mapper::toDomain).toList();
  }

  @Override
  public boolean deleteById(UUID id) {
    if (!jpa.existsById(id)) return false;
    jpa.deleteById(id);
    return true;
  }
}
