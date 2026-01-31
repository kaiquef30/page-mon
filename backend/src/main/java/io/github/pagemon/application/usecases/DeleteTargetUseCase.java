package io.github.pagemon.application.usecases;

import io.github.pagemon.application.ports.ChangeStore;
import io.github.pagemon.application.ports.SnapshotStore;
import io.github.pagemon.application.ports.TargetStore;

import java.util.UUID;


public class DeleteTargetUseCase {

  private final TargetStore targets;
  private final SnapshotStore snapshots;
  private final ChangeStore changes;

  public DeleteTargetUseCase(TargetStore targets, SnapshotStore snapshots, ChangeStore changes) {
    this.targets = targets;
    this.snapshots = snapshots;
    this.changes = changes;
  }

  public void execute(UUID id) {
    if (targets.findById(id).isEmpty()) {
      throw new NotFound("Target not found: " + id);
    }

    changes.deleteByTargetId(id);
    snapshots.deleteByTargetId(id);
    targets.deleteById(id);
  }

  public static final class NotFound extends RuntimeException {
    public NotFound(String msg) { super(msg); }
  }
}
