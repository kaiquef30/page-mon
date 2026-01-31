package io.github.pagemon.domain.exceptions;

public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }

    protected DomainException(String message, Throwable cause) {
        super(message, cause);
    }

    public abstract ErrorCode errorCode();

    public enum ErrorCode {
        TARGET_NOT_FOUND,
        FETCH_FAILED,
        VALIDATION_ERROR,
        CONFIGURATION_ERROR
    }
}
