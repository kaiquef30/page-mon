package io.github.pagemon.application.ports;

public record FetchResult(
    int httpStatus,
    String etag,
    String lastModified,
    String rawHtml
) {}
