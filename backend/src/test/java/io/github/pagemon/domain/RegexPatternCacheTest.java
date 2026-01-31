package io.github.pagemon.domain;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

class RegexPatternCacheTest {

    @BeforeEach
    @AfterEach
    void clearCache() {
        RegexPatternCache.clear();
    }

    @Test
    void shouldCompileAndCachePattern() {
        String regex = "test\\d+";
        int initialSize = RegexPatternCache.size();

        Pattern pattern1 = RegexPatternCache.compile(regex);
        Pattern pattern2 = RegexPatternCache.compile(regex);

        assertNotNull(pattern1);
        assertSame(pattern1, pattern2, "Should return same cached instance");
        assertEquals(initialSize + 1, RegexPatternCache.size());
    }

    @Test
    void shouldCompileMultiplePatterns() {
        List<String> regexes = List.of("\\d+", "[a-z]+", "test.*");
        int initialSize = RegexPatternCache.size();

        List<Pattern> patterns = RegexPatternCache.compileAll(regexes);

        assertEquals(3, patterns.size());
        assertTrue(RegexPatternCache.size() >= initialSize + 3,
                "Cache should contain at least the 3 new patterns");

        List<Pattern> patterns2 = RegexPatternCache.compileAll(regexes);

        for (int i = 0; i < patterns.size(); i++) {
            assertSame(patterns.get(i), patterns2.get(i), "Should reuse cached patterns");
        }
    }

    @Test
    void shouldMatchCorrectly() {
        Pattern pattern = RegexPatternCache.compile("\\d{3}");

        assertTrue(pattern.matcher("test123end").find());
        assertFalse(pattern.matcher("test12end").find());
    }

    @Test
    void shouldClearCacheWhenMaxSizeReached() {
        for (int i = 0; i < 1001; i++) {
            RegexPatternCache.compile("pattern" + i);
        }

        assertTrue(RegexPatternCache.size() < 1001,
                "Cache should be cleared when MAX_SIZE is exceeded");
    }

    @Test
    void shouldHandleEmptyList() {
        List<Pattern> patterns = RegexPatternCache.compileAll(List.of());

        assertTrue(patterns.isEmpty());
        assertEquals(0, RegexPatternCache.size());
    }

    @Test
    void shouldBeThreadSafe() throws InterruptedException {
        String uniquePattern = "threadSafeTest_" + System.nanoTime() + "\\d+";
        int initialSize = RegexPatternCache.size();
        int threadCount = 10;
        Thread[] threads = new Thread[threadCount];

        for (int i = 0; i < threadCount; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 100; j++) {
                    RegexPatternCache.compile(uniquePattern);
                }
            });
        }

        for (Thread thread : threads) {
            thread.start();
        }

        for (Thread thread : threads) {
            thread.join();
        }

        assertEquals(initialSize + 1, RegexPatternCache.size(),
                "Thread-safe cache should only add one new pattern");
    }
}
