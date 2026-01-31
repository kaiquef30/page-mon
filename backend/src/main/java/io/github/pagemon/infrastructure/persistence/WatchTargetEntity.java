package io.github.pagemon.infrastructure.persistence;

import io.github.pagemon.domain.FetchMode;
import io.github.pagemon.domain.TargetStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "watch_target",
        indexes = {
                @Index(name = "idx_watch_target_enabled_next_run", columnList = "enabled,next_run_at")
        }
)
public class WatchTargetEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 2048)
    private String url;

    @Column(nullable = false)
    private boolean enabled;

    @Enumerated(EnumType.STRING)
    @Column(name = "fetch_mode", nullable = false)
    private FetchMode fetchMode;

    @Column(name = "css_selector")
    private String cssSelector;

    @Lob
    @Convert(converter = JsonStringListConverter.class)
    @Column(name = "ignore_regexes")
    private List<String> ignoreRegexes;

    @Column(name = "interval_seconds", nullable = false)
    private long intervalSeconds;

    @Column(name = "next_run_at", columnDefinition = "timestamp")
    private Instant nextRunAt;

    @Column(name = "last_run_at", columnDefinition = "timestamp")
    private Instant lastRunAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_status", nullable = false)
    private TargetStatus lastStatus;

    @Lob
    @Column(name = "last_error")
    private String lastError;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public FetchMode getFetchMode() { return fetchMode; }
    public void setFetchMode(FetchMode fetchMode) { this.fetchMode = fetchMode; }

    public String getCssSelector() { return cssSelector; }
    public void setCssSelector(String cssSelector) { this.cssSelector = cssSelector; }

    public List<String> getIgnoreRegexes() { return ignoreRegexes; }
    public void setIgnoreRegexes(List<String> ignoreRegexes) { this.ignoreRegexes = ignoreRegexes; }

    public long getIntervalSeconds() { return intervalSeconds; }
    public void setIntervalSeconds(long intervalSeconds) { this.intervalSeconds = intervalSeconds; }

    public Instant getNextRunAt() { return nextRunAt; }
    public void setNextRunAt(Instant nextRunAt) { this.nextRunAt = nextRunAt; }

    public Instant getLastRunAt() { return lastRunAt; }
    public void setLastRunAt(Instant lastRunAt) { this.lastRunAt = lastRunAt; }

    public TargetStatus getLastStatus() { return lastStatus; }
    public void setLastStatus(TargetStatus lastStatus) { this.lastStatus = lastStatus; }

    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }

    public Duration interval() { return Duration.ofSeconds(intervalSeconds); }
}
