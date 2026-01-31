package io.github.pagemon.domain.exceptions;

public class ValidationException extends DomainException {

    private final String field;

    public ValidationException(String message) {
        super(message);
        this.field = null;
    }

    public ValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }

    @Override
    public ErrorCode errorCode() {
        return ErrorCode.VALIDATION_ERROR;
    }
}
