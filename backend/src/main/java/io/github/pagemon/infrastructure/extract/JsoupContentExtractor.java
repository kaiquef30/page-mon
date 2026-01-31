package io.github.pagemon.infrastructure.extract;

import io.github.pagemon.application.usecases.RunMonitorUseCase;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;

@Component
public class JsoupContentExtractor implements RunMonitorUseCase.ContentExtractor {

  @Override
  public String extractText(String rawHtml, String cssSelector) {
    if (rawHtml == null) return "";
    Document doc = Jsoup.parse(rawHtml);

    doc.select("script,style,noscript").remove();

    if (cssSelector != null && !cssSelector.isBlank()) {
      var elements = doc.select(cssSelector);
      if (elements.isEmpty()) {
        return doc.body() != null ? doc.body().text() : doc.text();
      }
      return elements.eachText().stream().reduce((a, b) -> a + "\n" + b).orElse("");
    }

    return doc.body() != null ? doc.body().text() : doc.text();
  }
}
