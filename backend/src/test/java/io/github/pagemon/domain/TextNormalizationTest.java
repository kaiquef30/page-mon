package io.github.pagemon.domain;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TextNormalizationTest {

  @Test
  void normalizesWhitespaceAndRemovesEmptyLines() {
    String in = "  hello   world \n\n\t  oi  \r\n";
    String out = TextNormalization.normalize(in, List.of());
    assertEquals("hello world\noi", out);
  }

  @Test
  void ignoresLinesByRegex() {
    String in = "Atualizado em 01/01/2026\nValor: 10\n";
    String out = TextNormalization.normalize(in, List.of("Atualizado em .*"));
    assertEquals("Valor: 10", out);
  }
}
