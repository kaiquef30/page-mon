package io.github.pagemon.application.ports;

import io.github.pagemon.domain.WatchTarget;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TargetStore {
  WatchTarget save(WatchTarget target);
  Optional<WatchTarget> findById(UUID id);
  List<WatchTarget> findAll();
  List<WatchTarget> findDue(Instant now, int limit);

  boolean deleteById(UUID id);
}
