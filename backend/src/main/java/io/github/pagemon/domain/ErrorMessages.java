package io.github.pagemon.domain;

import java.net.URI;
import java.util.UUID;

public final class ErrorMessages {

    private ErrorMessages() {
    }

    public static String targetNotFound(UUID id) {
        return String.format("Target with ID %s not found", id);
    }

    public static String targetDisabled() {
        return "Target is disabled and cannot be executed";
    }

    public static String targetNotDue(String nextRunAt) {
        return String.format("Target is not due for execution yet (nextRunAt=%s)", nextRunAt);
    }

    public static String targetAlreadyLocked(String lockKey) {
        return String.format("Execution already in progress for this target (lock=%s)", lockKey);
    }

    public static String fetchFailedNoStatus() {
        return "Fetch failed without HTTP status (likely network error)";
    }

    public static String fetchFailedWithStatus(int statusCode) {
        return String.format("HTTP request failed with status code %d", statusCode);
    }

    public static String fetchFailedBadGateway(URI url, int statusCode) {
        return String.format("Failed to fetch %s: HTTP %d", url, statusCode);
    }

    public static String noContentChange(String reason) {
        return String.format("No content change detected: %s", reason);
    }

    public static String contentHashMatch() {
        return "Hash identical (no relevant change after normalization)";
    }

    public static String httpNotModified() {
        return "HTTP 304 Not Modified";
    }

    public static String changeDetected() {
        return "Content change detected";
    }

    public static String changeRecorded(int addedLines, int removedLines) {
        return String.format("Change recorded: +%d -%d lines", addedLines, removedLines);
    }

    public static String executionSkipped(String reason) {
        return String.format("Execution skipped: %s", reason);
    }

    public static String executionFailed(String errorType, String details) {
        return String.format("%s: %s", errorType, details);
    }

    public static String invalidField(String field, String reason) {
        return String.format("Invalid %s: %s", field, reason);
    }

    public static String requiredField(String field) {
        return String.format("%s is required", field);
    }

    public static String invalidConfiguration(String key, String reason) {
        return String.format("Invalid configuration for %s: %s", key, reason);
    }

    public static String missingConfiguration(String key) {
        return String.format("Missing required configuration: %s", key);
    }

    public static String batchExecutionComplete(int total, int successful, int failed) {
        return String.format("Batch execution complete: %d total, %d successful, %d failed",
                total, successful, failed);
    }

    public static String noDueTargets() {
        return "No targets due for execution";
    }
}
