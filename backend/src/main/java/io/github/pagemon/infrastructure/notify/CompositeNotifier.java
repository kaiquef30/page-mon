package io.github.pagemon.infrastructure.notify;

import io.github.pagemon.application.ports.Notifier;
import io.github.pagemon.domain.ChangeEvent;
import io.github.pagemon.domain.WatchTarget;
import io.github.pagemon.infrastructure.logging.LoggingContext;
import io.github.pagemon.infrastructure.logging.StructuredLogger;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;

@Primary
@Component
public class CompositeNotifier implements Notifier {

    private static final StructuredLogger log = StructuredLogger.forClass(CompositeNotifier.class);

    private final List<Notifier> delegates;

    public CompositeNotifier(List<Notifier> delegates) {
        this.delegates = delegates.stream()
                .filter(n -> !(n instanceof CompositeNotifier))
                .toList();
    }

    @Override
    public void notifyChange(WatchTarget target, ChangeEvent event) {
        int successCount = 0;
        int failureCount = 0;

        for (Notifier notifier : delegates) {
            String notifierType = notifier.getClass().getSimpleName();

            try {
                LoggingContext.put(LoggingContext.NOTIFIER_TYPE, notifierType);
                notifier.notifyChange(target, event);
                successCount++;

                log.debug()
                    .message("Notification sent successfully")
                    .component("CompositeNotifier")
                    .operation("notify_change")
                    .field("notifierType", notifierType)
                    .field("targetId", target.id())
                    .field("changeId", event.id())
                    .status("success")
                    .log();

            } catch (Exception e) {
                failureCount++;

                log.warn()
                    .message("Failed to notify")
                    .component("CompositeNotifier")
                    .operation("notify_change")
                    .field("notifierType", notifierType)
                    .field("targetId", target.id())
                    .field("changeId", event.id())
                    .exception(e)
                    .status("error")
                    .log();
            } finally {
                LoggingContext.remove(LoggingContext.NOTIFIER_TYPE);
            }
        }

        log.info()
            .message("Notification processed by all notifiers")
            .component("CompositeNotifier")
            .operation("notify_change")
            .field("targetId", target.id())
            .field("changeId", event.id())
            .field("totalNotifiers", delegates.size())
            .field("successCount", successCount)
            .field("failureCount", failureCount)
            .status(failureCount == 0 ? "success" : "partial_failure")
            .log();
    }
}
