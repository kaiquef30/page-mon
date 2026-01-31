package io.github.pagemon.application.ports;

import io.github.pagemon.domain.ChangeEvent;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChangeStore {
  ChangeEvent save(ChangeEvent event);
  Optional<ChangeEvent> findById(UUID id);
  List<ChangeEvent> findByTargetId(UUID targetId, int limit);
  List<ChangeEvent> findRecent(int limit);
  void deleteByTargetId(UUID targetId);
}
