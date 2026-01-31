package io.github.pagemon.application.usecases;

import io.github.pagemon.application.ports.*;
import io.github.pagemon.domain.*;
import io.github.pagemon.domain.exceptions.FetchFailedException;
import io.github.pagemon.domain.exceptions.TargetNotFoundException;

import java.time.Instant;
import java.util.UUID;

import static io.github.pagemon.domain.ErrorMessages.*;
import static io.github.pagemon.domain.MonitorConstants.HTTP_BAD_REQUEST;
import static io.github.pagemon.domain.MonitorConstants.HTTP_NOT_MODIFIED;
import static io.github.pagemon.domain.TextNormalization.normalize;


public class RunMonitorUseCase {
    private final TargetStore targets;
    private final SnapshotStore snapshots;
    private final ChangeStore changes;
    private final PageFetcher fetcher;
    private final Notifier notifier;
    private final ClockPort clock;
    private final DiffEngine diffEngine;
    private final ContentExtractor extractor;
    private final LockPort locks;

    public RunMonitorUseCase(
            TargetStore targets,
            SnapshotStore snapshots,
            ChangeStore changes,
            PageFetcher fetcher,
            Notifier notifier,
            ClockPort clock,
            DiffEngine diffEngine,
            ContentExtractor extractor,
            LockPort locks
    ) {
        this.targets = targets;
        this.snapshots = snapshots;
        this.changes = changes;
        this.fetcher = fetcher;
        this.notifier = notifier;
        this.clock = clock;
        this.diffEngine = diffEngine;
        this.extractor = extractor;
        this.locks = locks;
    }

    public RunResult run(UUID targetId, boolean force) {
        return run(targetId, force, null);
    }

    public RunResult run(UUID targetId, boolean force, Snapshot preloadedSnapshot) {
        final String lockKey = "target:" + targetId;

        try (LockPort.LockHandle lock = locks.tryAcquire(lockKey)) {
            if (!lock.acquired()) {
                return RunResult.skipped(targetAlreadyLocked(lockKey));
            }

            WatchTarget target = targets.findById(targetId)
                    .orElseThrow(() -> new TargetNotFoundException(targetId));

            Instant now = clock.now();

            if (!target.enabled()) {
                return RunResult.skipped(targetDisabled());
            }
            if (!force && target.nextRunAt() != null && now.isBefore(target.nextRunAt())) {
                return RunResult.skipped(targetNotDue(target.nextRunAt().toString()));
            }

            Snapshot latest = preloadedSnapshot != null
                    ? preloadedSnapshot
                    : snapshots.findLatestByTargetId(target.id()).orElse(null);
            ConditionalHeaders conditional = latest == null
                    ? ConditionalHeaders.empty()
                    : new ConditionalHeaders(latest.etag(), latest.lastModified());

            try {
                FetchResult fetchResult = fetcher.fetch(target.url(), target.fetchMode(), conditional);


                if (fetchResult.httpStatus() <= 0) {
                    throw new FetchFailedException(fetchFailedNoStatus());
                }
                if (fetchResult.httpStatus() >= HTTP_BAD_REQUEST) {
                    throw new FetchFailedException(
                            target.url(),
                            fetchResult.httpStatus(),
                            fetchFailedWithStatus(fetchResult.httpStatus())
                    );
                }

                if (fetchResult.httpStatus() == HTTP_NOT_MODIFIED && latest != null) {
                    WatchTarget updated = new WatchTarget(
                            target.id(), target.name(), target.url(), target.enabled(), target.fetchMode(), target.cssSelector(), target.ignoreRegexes(), target.interval(),
                            now.plus(target.interval()), now, TargetStatus.OK, null
                    );
                    targets.save(updated);
                    return RunResult.noChange(httpNotModified());
                }

                String extracted = extractor.extractText(fetchResult.rawHtml(), target.cssSelector());
                String normalized = normalize(extracted, target.ignoreRegexes());
                String hash = Hashing.sha256Hex(normalized);

                Snapshot newSnap = new Snapshot(
                        UUID.randomUUID(),
                        target.id(),
                        now,
                        fetchResult.httpStatus(),
                        fetchResult.etag(),
                        fetchResult.lastModified(),
                        hash,
                        normalized,
                        fetchResult.rawHtml()
                );

                Snapshot saved = snapshots.save(newSnap);

                if (latest != null && hash.equals(latest.contentHashSha256())) {
                    WatchTarget updated = new WatchTarget(
                            target.id(), target.name(), target.url(), target.enabled(), target.fetchMode(), target.cssSelector(), target.ignoreRegexes(), target.interval(),
                            now.plus(target.interval()), now, TargetStatus.OK, null
                    );
                    targets.save(updated);
                    return RunResult.noChange(contentHashMatch());
                }

                DiffEngine.DiffResult diffResult = diffEngine.unifiedDiff(
                        latest == null ? "" : latest.normalizedText(),
                        normalized,
                        target.name()
                );

                ChangeEvent event = new ChangeEvent(
                        UUID.randomUUID(),
                        target.id(),
                        now,
                        latest == null ? null : latest.id(),
                        saved.id(),
                        diffResult.addedLines(),
                        diffResult.removedLines(),
                        diffResult.unifiedDiff()
                );
                ChangeEvent savedEvent = changes.save(event);

                WatchTarget updated = new WatchTarget(
                        target.id(), target.name(), target.url(), target.enabled(), target.fetchMode(), target.cssSelector(), target.ignoreRegexes(), target.interval(),
                        now.plus(target.interval()), now, TargetStatus.OK, null
                );
                targets.save(updated);

                notifier.notifyChange(updated, savedEvent);

                return RunResult.changed(savedEvent.id());

            } catch (Exception e) {
                WatchTarget updated = new WatchTarget(
                        target.id(), target.name(), target.url(), target.enabled(), target.fetchMode(), target.cssSelector(), target.ignoreRegexes(), target.interval(),
                        now.plus(target.interval()), now, TargetStatus.FETCH_FAILED, e.getMessage()
                );
                targets.save(updated);
                return RunResult.failed(e.getClass().getSimpleName() + ": " + e.getMessage());
            }
        }
    }

    public record RunResult(Status status, String message, UUID changeEventId) {
        public enum Status { CHANGED, NO_CHANGE, SKIPPED, FAILED }

        public static RunResult changed(UUID id) { return new RunResult(Status.CHANGED, changeDetected(), id); }
        public static RunResult noChange(String msg) { return new RunResult(Status.NO_CHANGE, msg, null); }
        public static RunResult skipped(String msg) { return new RunResult(Status.SKIPPED, msg, null); }
        public static RunResult failed(String msg) { return new RunResult(Status.FAILED, msg, null); }
    }

    public interface DiffEngine {
        DiffResult unifiedDiff(String oldText, String newText, String title);
        record DiffResult(int addedLines, int removedLines, String unifiedDiff) {}
    }

    public interface ContentExtractor {
        String extractText(String rawHtml, String cssSelector);
    }
}
