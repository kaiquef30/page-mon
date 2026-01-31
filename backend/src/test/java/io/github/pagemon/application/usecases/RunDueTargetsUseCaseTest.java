package io.github.pagemon.application.usecases;

import io.github.pagemon.application.ports.SnapshotStore;
import io.github.pagemon.application.ports.TargetStore;
import io.github.pagemon.domain.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.*;

class RunDueTargetsUseCaseTest {

    private TargetStore targetStore;
    private SnapshotStore snapshotStore;
    private RunMonitorUseCase runMonitorUseCase;
    private ExecutorService executor;
    private RunDueTargetsUseCase useCase;

    @BeforeEach
    void setUp() {
        targetStore = mock(TargetStore.class);
        snapshotStore = mock(SnapshotStore.class);
        runMonitorUseCase = mock(RunMonitorUseCase.class);
        executor = Executors.newFixedThreadPool(4);

        useCase = new RunDueTargetsUseCase(
                targetStore,
                snapshotStore,
                runMonitorUseCase,
                Instant::now,
                executor
        );
    }

    @AfterEach
    void tearDown() {
        executor.shutdown();
    }

    @Test
    void shouldReturnZeroWhenNoDueTargets() {
        when(targetStore.findDue(any(), anyInt())).thenReturn(Collections.emptyList());

        RunDueTargetsUseCase.ExecutionResult result = useCase.executeParallel(10);

        assertEquals(0, result.total());
        assertEquals(0, result.changed());
        assertEquals(0, result.noChange());
        assertEquals(0, result.skipped());
        assertEquals(0, result.failed());
        verifyNoInteractions(snapshotStore, runMonitorUseCase);
    }

    @Test
    void shouldExecuteTargetsInParallel() {
        List<WatchTarget> dueTargets = createDueTargets(5);
        List<UUID> dueIds = dueTargets.stream().map(WatchTarget::id).toList();

        when(targetStore.findDue(any(), anyInt())).thenReturn(dueTargets);
        when(snapshotStore.findLatestByTargetIds(dueIds)).thenReturn(Collections.emptyMap());

        when(runMonitorUseCase.run(any(), anyBoolean(), any()))
                .thenReturn(RunMonitorUseCase.RunResult.changed(UUID.randomUUID()))
                .thenReturn(RunMonitorUseCase.RunResult.noChange("No changes"))
                .thenReturn(RunMonitorUseCase.RunResult.changed(UUID.randomUUID()))
                .thenReturn(RunMonitorUseCase.RunResult.skipped("Skipped"))
                .thenReturn(RunMonitorUseCase.RunResult.failed("Error"));

        RunDueTargetsUseCase.ExecutionResult result = useCase.executeParallel(10);

        assertEquals(5, result.total());
        assertEquals(2, result.changed());
        assertEquals(1, result.noChange());
        assertEquals(1, result.skipped());
        assertEquals(1, result.failed());
        assertEquals(3, result.successful());
        assertEquals(0.6, result.successRate(), 0.01);

        verify(targetStore).findDue(any(), eq(10));
        verify(snapshotStore).findLatestByTargetIds(dueIds);
        verify(runMonitorUseCase, times(5)).run(any(), eq(false), any());
    }

    @Test
    void shouldBatchLoadSnapshots() {
        List<WatchTarget> dueTargets = createDueTargets(3);
        List<UUID> dueIds = dueTargets.stream().map(WatchTarget::id).toList();

        Map<UUID, Snapshot> snapshots = new HashMap<>();
        snapshots.put(dueIds.get(0), createSnapshot(dueIds.get(0)));
        snapshots.put(dueIds.get(1), createSnapshot(dueIds.get(1)));

        when(targetStore.findDue(any(), anyInt())).thenReturn(dueTargets);
        when(snapshotStore.findLatestByTargetIds(dueIds)).thenReturn(snapshots);
        when(runMonitorUseCase.run(any(), anyBoolean(), any()))
                .thenReturn(RunMonitorUseCase.RunResult.noChange("No changes"));

        useCase.executeParallel(10);

        verify(snapshotStore, times(1)).findLatestByTargetIds(dueIds);
        verify(snapshotStore, never()).findLatestByTargetId(any());
    }

    @Test
    void shouldProvideBackwardCompatibility() {
        when(targetStore.findDue(any(), anyInt())).thenReturn(createDueTargets(2));
        when(snapshotStore.findLatestByTargetIds(any())).thenReturn(Collections.emptyMap());
        when(runMonitorUseCase.run(any(), anyBoolean(), any()))
                .thenReturn(RunMonitorUseCase.RunResult.changed(UUID.randomUUID()));

        int count = useCase.execute(10);

        assertEquals(2, count);
    }

    private List<WatchTarget> createDueTargets(int count) {
        List<WatchTarget> targets = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            targets.add(new WatchTarget(
                    UUID.randomUUID(),
                    "Target " + i,
                    URI.create("https://example.com/" + i),
                    true,
                    FetchMode.AUTO,
                    null,
                    Collections.emptyList(),
                    Duration.ofMinutes(5),
                    Instant.now().minusSeconds(60),
                    Instant.now().minusSeconds(300),
                    TargetStatus.OK,
                    null
            ));
        }
        return targets;
    }

    private Snapshot createSnapshot(UUID targetId) {
        return new Snapshot(
                UUID.randomUUID(),
                targetId,
                Instant.now().minus(Duration.ofMinutes(5)),
                200,
                null,
                null,
                "hash123",
                "content",
                "<html>content</html>"
        );
    }
}
