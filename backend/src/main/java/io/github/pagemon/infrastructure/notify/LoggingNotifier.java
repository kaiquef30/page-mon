package io.github.pagemon.infrastructure.notify;

import io.github.pagemon.application.ports.Notifier;
import io.github.pagemon.domain.ChangeEvent;
import io.github.pagemon.domain.WatchTarget;
import io.github.pagemon.infrastructure.logging.LoggingContext;
import io.github.pagemon.infrastructure.logging.StructuredLogger;
import org.springframework.stereotype.Component;

@Component
public class LoggingNotifier implements Notifier {
  private static final StructuredLogger log = StructuredLogger.forClass(LoggingNotifier.class);

  @Override
  public void notifyChange(WatchTarget target, ChangeEvent event) {
    LoggingContext.setTarget(target.id(), target.url().toString());
    LoggingContext.setChange(event.id());
    LoggingContext.put(LoggingContext.NOTIFIER_TYPE, "logging");

    log.info()
        .message("Change detected")
        .component("LoggingNotifier")
        .operation("notify_change")
        .target(target.id(), target.name(), target.url().toString())
        .change(event.id(), event.addedLines(), event.removedLines())
        .field("totalChangedLines", event.addedLines() + event.removedLines())
        .field("hasAdditions", event.addedLines() > 0)
        .field("hasRemovals", event.removedLines() > 0)
        .status("notified")
        .log();
  }
}
