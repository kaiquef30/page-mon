package io.github.pagemon.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

public final class TextNormalization {
  private TextNormalization() {}

  public static String normalize(String text, List<String> ignoreRegexes) {
    if (text == null) return "";
    String cleaned = text.replace("\r\n", "\n").replace("\r", "\n");

    List<String> lines = new ArrayList<>();
    for (String line : cleaned.split("\n")) {
      String trimmedLine = line.strip();
      if (!trimmedLine.isEmpty()) lines.add(trimmedLine);
    }

    if (ignoreRegexes != null && !ignoreRegexes.isEmpty()) {
      List<Pattern> patterns = RegexPatternCache.compileAll(ignoreRegexes);
      lines = lines.stream()
          .filter(line -> patterns.stream().noneMatch(pattern -> pattern.matcher(line).find()))
          .toList();
    }

    String joined = String.join("\n", lines);
    joined = joined.replaceAll("[\t\f ]+", " ");
    return joined.strip();
  }
}
