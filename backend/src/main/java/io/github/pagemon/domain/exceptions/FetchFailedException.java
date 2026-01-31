package io.github.pagemon.domain.exceptions;

import java.net.URI;

public class FetchFailedException extends DomainException {

    private final URI url;
    private final Integer httpStatus;

    public FetchFailedException(String message) {
        super(message);
        this.url = null;
        this.httpStatus = null;
    }

    public FetchFailedException(String message, Throwable cause) {
        super(message, cause);
        this.url = null;
        this.httpStatus = null;
    }

    public FetchFailedException(URI url, int httpStatus, String message) {
        super(message);
        this.url = url;
        this.httpStatus = httpStatus;
    }

    public URI getUrl() {
        return url;
    }

    public Integer getHttpStatus() {
        return httpStatus;
    }

    @Override
    public ErrorCode errorCode() {
        return ErrorCode.FETCH_FAILED;
    }
}
