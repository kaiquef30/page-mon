package io.github.pagemon.infrastructure.persistence;

import io.github.pagemon.application.ports.ChangeStore;
import io.github.pagemon.domain.ChangeEvent;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
public class JpaChangeStore implements ChangeStore {

  private final ChangeEventJpaRepository jpa;

  public JpaChangeStore(ChangeEventJpaRepository jpa) {
    this.jpa = jpa;
  }

  @Override
  public ChangeEvent save(ChangeEvent event) {
    var saved = jpa.save(Mapper.toEntity(event));
    return Mapper.toDomain(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<ChangeEvent> findById(UUID id) {
    return jpa.findById(id).map(Mapper::toDomain);
  }

  @Override
  @Transactional(readOnly = true)
  public List<ChangeEvent> findByTargetId(UUID targetId, int limit) {
    return jpa.findByTargetId(targetId, PageRequest.of(0, Math.max(1, limit))).stream().map(Mapper::toDomain).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<ChangeEvent> findRecent(int limit) {
    return jpa.findRecent(PageRequest.of(0, Math.max(1, limit))).stream().map(Mapper::toDomain).toList();
  }

  @Override
  public void deleteByTargetId(UUID targetId) {
    jpa.deleteByTargetId(targetId);
  }
}
