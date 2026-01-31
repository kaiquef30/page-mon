package io.github.pagemon.infrastructure.diff;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JavaDiffUtilsEngineTest {

  @Test
  void generatesUnifiedDiff() {
    JavaDiffUtilsEngine eng = new JavaDiffUtilsEngine();
    var res = eng.unifiedDiff("a\n", "a\nb\n", "t");
    assertTrue(res.unifiedDiff().contains("+b"));
    assertEquals(1, res.addedLines());
  }
}
