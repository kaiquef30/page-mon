package io.github.pagemon.domain;

import java.time.Duration;

public final class MonitorConstants {

    private MonitorConstants() {
    }

    public static final int HTTP_NOT_MODIFIED = 304;
    public static final int HTTP_BAD_REQUEST = 400;

    public static final Duration DISCORD_CACHE_TTL = Duration.ofSeconds(30);
    public static final int REGEX_CACHE_MAX_SIZE = 1000;

    public static final int DEFAULT_SNAPSHOT_LIMIT = 20;

    public static final int MAX_DIFF_CHARS_DEFAULT = 2000;

    public static final int MIN_HTML_LENGTH_THRESHOLD = 1200;
    public static final int MIN_TEXT_LENGTH_THRESHOLD = 200;
    public static final int SCRIPT_TAG_COUNT_THRESHOLD = 200;
}
