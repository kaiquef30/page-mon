package io.github.pagemon.application.ports;

import io.github.pagemon.domain.FetchMode;

import java.net.URI;

public interface PageFetcher {
  FetchResult fetch(URI url, FetchMode mode, ConditionalHeaders conditional) throws Exception;
}
