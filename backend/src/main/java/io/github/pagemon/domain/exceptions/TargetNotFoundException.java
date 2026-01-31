package io.github.pagemon.domain.exceptions;

import java.util.UUID;

public class TargetNotFoundException extends DomainException {

    private final UUID targetId;

    public TargetNotFoundException(UUID targetId) {
        super("Target not found: " + targetId);
        this.targetId = targetId;
    }

    public TargetNotFoundException(String message) {
        super(message);
        this.targetId = null;
    }

    public UUID getTargetId() {
        return targetId;
    }

    @Override
    public ErrorCode errorCode() {
        return ErrorCode.TARGET_NOT_FOUND;
    }
}
