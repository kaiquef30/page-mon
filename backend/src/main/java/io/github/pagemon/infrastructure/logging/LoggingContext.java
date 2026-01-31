package io.github.pagemon.infrastructure.logging;

import org.slf4j.MDC;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;


public final class LoggingContext {

    public static final String REQUEST_ID = "requestId";
    public static final String TRACE_ID = "traceId";
    public static final String USER_ID = "userId";
    public static final String TARGET_ID = "targetId";
    public static final String CHANGE_ID = "changeId";
    public static final String SNAPSHOT_ID = "snapshotId";
    public static final String OPERATION = "operation";
    public static final String COMPONENT = "component";
    public static final String THREAD_NAME = "threadName";
    public static final String SCHEDULER_EXECUTION_ID = "schedulerExecutionId";
    public static final String BATCH_ID = "batchId";
    public static final String FETCH_MODE = "fetchMode";
    public static final String URL = "url";
    public static final String HTTP_METHOD = "httpMethod";
    public static final String HTTP_STATUS = "httpStatus";
    public static final String DURATION_MS = "durationMs";
    public static final String ERROR_TYPE = "errorType";
    public static final String NOTIFIER_TYPE = "notifierType";

    private LoggingContext() {
    }

    public static void put(String key, String value) {
        if (value != null) {
            MDC.put(key, value);
        }
    }

    public static void put(String key, Long value) {
        if (value != null) {
            MDC.put(key, value.toString());
        }
    }

    public static void put(String key, Integer value) {
        if (value != null) {
            MDC.put(key, value.toString());
        }
    }

    public static void put(String key, UUID value) {
        if (value != null) {
            MDC.put(key, value.toString());
        }
    }

    public static String get(String key) {
        return MDC.get(key);
    }

    public static void remove(String key) {
        MDC.remove(key);
    }

    public static void clear() {
        MDC.clear();
    }

    public static Map<String, String> getContext() {
        return MDC.getCopyOfContextMap();
    }

    public static void setContext(Map<String, String> context) {
        if (context != null) {
            MDC.setContextMap(context);
        }
    }

    public static String generateRequestId() {
        return UUID.randomUUID().toString();
    }

    public static String initRequestContext() {
        String requestId = generateRequestId();
        put(REQUEST_ID, requestId);
        put(THREAD_NAME, Thread.currentThread().getName());
        return requestId;
    }

    public static String initSchedulerContext(String schedulerName) {
        String executionId = generateRequestId();
        put(SCHEDULER_EXECUTION_ID, executionId);
        put(COMPONENT, schedulerName);
        put(THREAD_NAME, Thread.currentThread().getName());
        return executionId;
    }

    public static String initBatchContext() {
        String batchId = generateRequestId();
        put(BATCH_ID, batchId);
        put(THREAD_NAME, Thread.currentThread().getName());
        return batchId;
    }

    public static void setOperation(String operation) {
        put(OPERATION, operation);
    }

    public static void setComponent(String component) {
        put(COMPONENT, component);
    }

    public static void setTarget(UUID targetId, String url) {
        if (targetId != null) {
            put(TARGET_ID, targetId.toString());
        }
        if (url != null) {
            put(URL, url);
        }
    }

    public static void setChange(UUID changeId) {
        if (changeId != null) {
            put(CHANGE_ID, changeId.toString());
        }
    }

    public static void setSnapshot(UUID snapshotId) {
        if (snapshotId != null) {
            put(SNAPSHOT_ID, snapshotId.toString());
        }
    }

    public static void setError(String errorType) {
        put(ERROR_TYPE, errorType);
    }

    public static void setHttpInfo(String method, Integer status) {
        if (method != null) {
            put(HTTP_METHOD, method);
        }
        if (status != null) {
            put(HTTP_STATUS, status);
        }
    }

    public static void setDuration(long durationMs) {
        put(DURATION_MS, durationMs);
    }

    public static <T> T withContext(Map<String, String> additionalContext, Supplier<T> supplier) {
        Map<String, String> originalContext = getContext();
        try {
            if (originalContext != null) {
                Map<String, String> mergedContext = new HashMap<>(originalContext);
                if (additionalContext != null) {
                    mergedContext.putAll(additionalContext);
                }
                setContext(mergedContext);
            } else {
                setContext(additionalContext);
            }
            return supplier.get();
        } finally {
            if (originalContext != null) {
                setContext(originalContext);
            } else {
                clear();
            }
        }
    }

    public static void withContext(Map<String, String> additionalContext, Runnable runnable) {
        withContext(additionalContext, () -> {
            runnable.run();
            return null;
        });
    }

    public static ContextBuilder builder() {
        return new ContextBuilder();
    }

    public static class ContextBuilder {
        private final Map<String, String> context = new HashMap<>();

        public ContextBuilder requestId(String requestId) {
            context.put(REQUEST_ID, requestId);
            return this;
        }

        public ContextBuilder targetId(UUID targetId) {
            if (targetId != null) {
                context.put(TARGET_ID, targetId.toString());
            }
            return this;
        }

        public ContextBuilder changeId(UUID changeId) {
            if (changeId != null) {
                context.put(CHANGE_ID, changeId.toString());
            }
            return this;
        }

        public ContextBuilder operation(String operation) {
            context.put(OPERATION, operation);
            return this;
        }

        public ContextBuilder component(String component) {
            context.put(COMPONENT, component);
            return this;
        }

        public ContextBuilder url(String url) {
            if (url != null) {
                context.put(URL, url);
            }
            return this;
        }

        public ContextBuilder put(String key, String value) {
            if (value != null) {
                context.put(key, value);
            }
            return this;
        }

        public Map<String, String> build() {
            return new HashMap<>(context);
        }

        public void apply() {
            context.forEach(LoggingContext::put);
        }
    }
}
