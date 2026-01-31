package io.github.pagemon.application.ports;

public record ConditionalHeaders(
    String etag,
    String lastModified
) {
  public static ConditionalHeaders empty() {
    return new ConditionalHeaders(null, null);
  }
}
