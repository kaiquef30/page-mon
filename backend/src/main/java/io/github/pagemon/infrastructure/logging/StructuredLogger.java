package io.github.pagemon.infrastructure.logging;

import net.logstash.logback.argument.StructuredArguments;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class StructuredLogger {

    private final Logger logger;

    private StructuredLogger(Logger logger) {
        this.logger = logger;
    }

    public static StructuredLogger forClass(Class<?> clazz) {
        return new StructuredLogger(LoggerFactory.getLogger(clazz));
    }

    public static StructuredLogger forName(String name) {
        return new StructuredLogger(LoggerFactory.getLogger(name));
    }

    public Logger getLogger() {
        return logger;
    }

    public LogBuilder info() {
        return new LogBuilder(logger, LogLevel.INFO);
    }

    public LogBuilder debug() {
        return new LogBuilder(logger, LogLevel.DEBUG);
    }

    public LogBuilder warn() {
        return new LogBuilder(logger, LogLevel.WARN);
    }

    public LogBuilder error() {
        return new LogBuilder(logger, LogLevel.ERROR);
    }

    public LogBuilder trace() {
        return new LogBuilder(logger, LogLevel.TRACE);
    }

    public static class LogBuilder {
        private final Logger logger;
        private final LogLevel level;
        private final Map<String, Object> fields = new HashMap<>();
        private String message;
        private Throwable throwable;

        private LogBuilder(Logger logger, LogLevel level) {
            this.logger = logger;
            this.level = level;
        }

        public LogBuilder message(String message) {
            this.message = message;
            return this;
        }

        public LogBuilder field(String key, Object value) {
            if (value != null) {
                fields.put(key, value);
            }
            return this;
        }

        public LogBuilder fields(Map<String, Object> fields) {
            if (fields != null) {
                this.fields.putAll(fields);
            }
            return this;
        }

        public LogBuilder target(UUID targetId, String name, String url) {
            field("targetId", targetId);
            field("targetName", name);
            field("url", url);
            return this;
        }

        public LogBuilder change(UUID changeId, int linesAdded, int linesRemoved) {
            field("changeId", changeId);
            field("linesAdded", linesAdded);
            field("linesRemoved", linesRemoved);
            return this;
        }

        public LogBuilder snapshot(UUID snapshotId, String contentHash) {
            field("snapshotId", snapshotId);
            field("contentHash", contentHash);
            return this;
        }

        public LogBuilder duration(long durationMs) {
            field("durationMs", durationMs);
            return this;
        }

        public LogBuilder result(String result) {
            field("result", result);
            return this;
        }

        public LogBuilder status(String status) {
            field("status", status);
            return this;
        }

        public LogBuilder count(String name, long value) {
            field(name, value);
            return this;
        }

        public LogBuilder exception(Throwable throwable) {
            this.throwable = throwable;
            if (throwable != null) {
                field("exceptionType", throwable.getClass().getSimpleName());
                field("exceptionMessage", throwable.getMessage());
            }
            return this;
        }

        public LogBuilder operation(String operation) {
            field("operation", operation);
            return this;
        }

        public LogBuilder component(String component) {
            field("component", component);
            return this;
        }

        public void log() {
            if (message == null) {
                message = "Event";
            }

            Object[] args = fields.entrySet().stream()
                    .map(e -> StructuredArguments.keyValue(e.getKey(), e.getValue()))
                    .toArray();

            switch (level) {
                case TRACE -> {
                    if (throwable != null) {
                        logger.trace(message, args);
                        logger.trace("Exception details", throwable);
                    } else {
                        logger.trace(message, args);
                    }
                }
                case DEBUG -> {
                    if (throwable != null) {
                        logger.debug(message, args);
                        logger.debug("Exception details", throwable);
                    } else {
                        logger.debug(message, args);
                    }
                }
                case INFO -> {
                    if (throwable != null) {
                        logger.info(message, args);
                        logger.info("Exception details", throwable);
                    } else {
                        logger.info(message, args);
                    }
                }
                case WARN -> {
                    if (throwable != null) {
                        logger.warn(message, args);
                        logger.warn("Exception details", throwable);
                    } else {
                        logger.warn(message, args);
                    }
                }
                case ERROR -> {
                    if (throwable != null) {
                        logger.error(message, throwable, args);
                    } else {
                        logger.error(message, args);
                    }
                }
            }
        }
    }

    private enum LogLevel {
        TRACE, DEBUG, INFO, WARN, ERROR
    }
}
