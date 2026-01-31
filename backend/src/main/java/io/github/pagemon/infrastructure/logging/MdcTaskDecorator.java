package io.github.pagemon.infrastructure.logging;

import org.springframework.core.task.TaskDecorator;

import java.util.Map;

public class MdcTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        Map<String, String> contextMap = LoggingContext.getContext();

        return () -> {
            try {
                if (contextMap != null) {
                    LoggingContext.setContext(contextMap);
                }
                LoggingContext.put(LoggingContext.THREAD_NAME, Thread.currentThread().getName());

                runnable.run();
            } finally {
                LoggingContext.clear();
            }
        };
    }
}
