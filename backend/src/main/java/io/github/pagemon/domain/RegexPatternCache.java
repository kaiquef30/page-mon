package io.github.pagemon.domain;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import static io.github.pagemon.domain.MonitorConstants.REGEX_CACHE_MAX_SIZE;

public final class RegexPatternCache {
    private static final int MAX_SIZE = REGEX_CACHE_MAX_SIZE;
    private static final ConcurrentHashMap<String, Pattern> cache = new ConcurrentHashMap<>();

    private RegexPatternCache() {
    }

    public static Pattern compile(String regex) {
        return cache.computeIfAbsent(regex, r -> {
            if (cache.size() >= MAX_SIZE) {
                cache.clear();
            }
            return Pattern.compile(r);
        });
    }

    public static List<Pattern> compileAll(List<String> regexes) {
        return regexes.stream().map(RegexPatternCache::compile).toList();
    }

    public static int size() {
        return cache.size();
    }

    public static void clear() {
        cache.clear();
    }
}
