package io.github.pagemon.application.usecases;

import io.github.pagemon.application.ports.TargetStore;
import io.github.pagemon.domain.FetchMode;
import io.github.pagemon.domain.WatchTarget;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

public class UpdateTargetUseCase {
    private final TargetStore store;
    private final Clock clock;

    public UpdateTargetUseCase(TargetStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    public WatchTarget execute(UUID id, Patch patch) {
        WatchTarget current = store.findById(id).orElseThrow(() -> new NotFound("Target not found: " + id));
        Instant now = clock.now();

        if (patch.name() != null && patch.name().isBlank()) {
            throw new IllegalArgumentException("name cannot be empty");
        }
        if (patch.url() != null) {
            validateHttpUrl(patch.url());
        }

        List<String> ignoreRegexes = patch.ignoreRegexes() != null
                ? validateAndCopyRegexes(patch.ignoreRegexes())
                : current.ignoreRegexes();

        Duration interval = patch.interval() != null
                ? normalizeInterval(patch.interval())
                : current.interval();

        WatchTarget updated = new WatchTarget(
                current.id(),
                patch.name() != null ? patch.name().trim() : current.name(),
                patch.url() != null ? patch.url() : current.url(),
                patch.enabled() != null ? patch.enabled() : current.enabled(),
                patch.fetchMode() != null ? patch.fetchMode() : current.fetchMode(),
                patch.cssSelector() != null ? blankToNull(patch.cssSelector()) : current.cssSelector(),
                ignoreRegexes,
                interval,
                patch.interval() != null ? now.plus(interval) : current.nextRunAt(),
                current.lastRunAt(),
                current.lastStatus(),
                current.lastError()
        );
        return store.save(updated);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static Duration normalizeInterval(Duration interval) {
        if (interval == null) throw new IllegalArgumentException("interval is required");
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

    public record Patch(
            String name,
            URI url,
            Boolean enabled,
            FetchMode fetchMode,
            String cssSelector,
            List<String> ignoreRegexes,
            Duration interval
    ) {}

    public static final class NotFound extends RuntimeException {
        public NotFound(String msg) { super(msg); }
    }

    public interface Clock { Instant now(); }
}
