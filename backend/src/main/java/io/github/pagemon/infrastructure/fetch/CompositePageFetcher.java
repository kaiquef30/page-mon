package io.github.pagemon.infrastructure.fetch;

import io.github.pagemon.application.ports.*;
import io.github.pagemon.domain.FetchMode;
import org.springframework.stereotype.Component;

import java.net.URI;

import static io.github.pagemon.domain.MonitorConstants.*;


@Component
public class CompositePageFetcher implements PageFetcher {

  private final JsoupClient jsoup;
  private final PlaywrightClient playwright;

  public CompositePageFetcher(JsoupClient jsoup, PlaywrightClient playwright) {
    this.jsoup = jsoup;
    this.playwright = playwright;
  }

  @Override
  public FetchResult fetch(URI url, FetchMode mode, ConditionalHeaders conditional) throws Exception {
    FetchMode fetchMode = mode == null ? FetchMode.AUTO : mode;

    return switch (fetchMode) {
      case JSOUP -> jsoup.fetch(url, conditional);
      case PLAYWRIGHT -> playwright.fetch(url);
      case AUTO -> {
        FetchResult fetchResult = jsoup.fetch(url, conditional);
        if (fetchResult.httpStatus() == HTTP_NOT_MODIFIED) yield fetchResult;
        if (looksLikeClientRendered(fetchResult.rawHtml())) {
          yield playwright.fetch(url);
        }
        yield fetchResult;
      }
    };
  }

  private boolean looksLikeClientRendered(String html) {
    if (html == null) return true;
    String htmlLowerCase = html.toLowerCase();
    boolean veryShort = htmlLowerCase.length() < MIN_HTML_LENGTH_THRESHOLD;
    boolean hasAppRoot = htmlLowerCase.contains("id=root") || htmlLowerCase.contains("id=app");
    boolean hasNoscript = htmlLowerCase.contains("<noscript") && htmlLowerCase.contains("enable javascript");
    boolean hasManyScriptsAndLittleText = htmlLowerCase.chars().filter(ch -> ch == '<').count() > SCRIPT_TAG_COUNT_THRESHOLD
        && stripTags(htmlLowerCase).strip().length() < MIN_TEXT_LENGTH_THRESHOLD;
    return hasNoscript || (veryShort && hasAppRoot) || hasManyScriptsAndLittleText;
  }

  private String stripTags(String html) {
    return html.replaceAll("<[^>]+>", " ");
  }
}
