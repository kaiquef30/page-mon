package io.github.pagemon.infrastructure.fetch;

import io.github.pagemon.application.ports.ConditionalHeaders;
import io.github.pagemon.application.ports.FetchResult;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.Duration;

@Component
public class JsoupClient {

  private final Duration timeout;
  private final String userAgent;

  public JsoupClient(FetchSettings settings) {
    this.timeout = settings.timeout();
    this.userAgent = settings.userAgent();
  }

  public FetchResult fetch(URI uri, ConditionalHeaders conditional) throws Exception {
    Connection connection = Jsoup.connect(uri.toString())
        .userAgent(userAgent)
        .timeout((int) timeout.toMillis())
        .followRedirects(true)
        .ignoreContentType(true);

    if (conditional != null) {
      if (conditional.etag() != null) connection.header("If-None-Match", conditional.etag());
      if (conditional.lastModified() != null) connection.header("If-Modified-Since", conditional.lastModified());
    }

    Connection.Response response = connection.execute();
    int status = response.statusCode();

    if (status == 304) {
      return new FetchResult(304, response.header("ETag"), response.header("Last-Modified"), "");
    }

    String html = response.body();
    return new FetchResult(status, response.header("ETag"), response.header("Last-Modified"), html);
  }
}
