package io.github.pagemon.application.ports;

import io.github.pagemon.domain.ChangeEvent;
import io.github.pagemon.domain.WatchTarget;

public interface Notifier {
  void notifyChange(WatchTarget target, ChangeEvent event);
}
