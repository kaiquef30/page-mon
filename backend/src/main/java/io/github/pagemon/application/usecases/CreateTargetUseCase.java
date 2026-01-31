package io.github.pagemon.application.usecases;

import io.github.pagemon.application.ports.TargetStore;
import io.github.pagemon.domain.FetchMode;
import io.github.pagemon.domain.TargetStatus;
import io.github.pagemon.domain.WatchTarget;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

public class CreateTargetUseCase {
    private final TargetStore store;
    private final Clock clock;

    public CreateTargetUseCase(TargetStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    public WatchTarget execute(
            String name,
            URI url,
            boolean enabled,
            FetchMode fetchMode,
            String cssSelector,
            List<String> ignoreRegexes,
            Duration interval
    ) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        validateHttpUrl(url);

        List<String> safeRegexes = validateAndCopyRegexes(ignoreRegexes);
        Duration safeInterval = normalizeInterval(interval);

        Instant now = clock.now();
        WatchTarget target = new WatchTarget(
                UUID.randomUUID(),
                name.trim(),
                url,
                enabled,
                fetchMode == null ? FetchMode.AUTO : fetchMode,
                blankToNull(cssSelector),
                safeRegexes,
                safeInterval,
                now,
                null,
                TargetStatus.OK,
                null
        );
        return store.save(target);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static Duration normalizeInterval(Duration interval) {
        if (interval == null) return Duration.ofHours(6);
        if (interval.isZero() || interval.isNegative()) {
            throw new IllegalArgumentException("interval must be > 0");
        }
        return interval;
    }

    private static void validateHttpUrl(URI url) {
        if (url == null) throw new IllegalArgumentException("url is required");
        String scheme = url.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("url must be http/https");
        }
        if (url.getHost() == null || url.getHost().isBlank()) {
            throw new IllegalArgumentException("invalid url (missing host)");
        }
    }

    private static List<String> validateAndCopyRegexes(List<String> ignoreRegexes) {
        if (ignoreRegexes == null) return List.of();
        for (String r : ignoreRegexes) {
            if (r == null) continue;
            try { Pattern.compile(r); }
            catch (PatternSyntaxException e) {
                throw new IllegalArgumentException("Invalid regex in ignoreRegexes: " + r, e);
            }
        }
        return List.copyOf(ignoreRegexes);
    }

    public interface Clock {
        Instant now();
    }
}
