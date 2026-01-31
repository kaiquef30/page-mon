package io.github.pagemon.application.usecases;

import io.github.pagemon.application.ports.SnapshotStore;
import io.github.pagemon.application.ports.TargetStore;
import io.github.pagemon.domain.Snapshot;
import io.github.pagemon.infrastructure.logging.LoggingContext;
import io.github.pagemon.infrastructure.logging.StructuredLogger;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;

public class RunDueTargetsUseCase {
  private static final StructuredLogger log = StructuredLogger.forClass(RunDueTargetsUseCase.class);

  private final TargetStore targets;
  private final SnapshotStore snapshots;
  private final RunMonitorUseCase runner;
  private final Clock clock;
  private final ExecutorService executor;

  public RunDueTargetsUseCase(
      TargetStore targets,
      SnapshotStore snapshots,
      RunMonitorUseCase runner,
      Clock clock,
      ExecutorService executor) {
    this.targets = targets;
    this.snapshots = snapshots;
    this.runner = runner;
    this.clock = clock;
    this.executor = executor;
  }

  public int execute(int batchSize) {
    return executeParallel(batchSize).total();
  }

  public ExecutionResult executeParallel(int batchSize) {
    String batchId = LoggingContext.initBatchContext();
    LoggingContext.setOperation("execute_due_targets");
    LoggingContext.setComponent("RunDueTargetsUseCase");

    long startTime = System.currentTimeMillis();

    try {
      Instant now = clock.now();
      List<UUID> dueIds = targets.findDue(now, batchSize).stream().map(t -> t.id()).toList();

      log.debug()
          .message("Buscando targets devido para processamento")
          .operation("execute_due_targets")
          .field("batchSize", batchSize)
          .field("foundTargets", dueIds.size())
          .log();

      if (dueIds.isEmpty()) {
        return new ExecutionResult(0, 0, 0, 0);
      }

      Map<UUID, Snapshot> latestSnapshots = snapshots.findLatestByTargetIds(dueIds);

      List<CompletableFuture<RunMonitorUseCase.RunResult>> futures = dueIds.stream()
          .map(id -> CompletableFuture.supplyAsync(
              () -> runner.run(id, false, latestSnapshots.get(id)),
              executor
          ))
          .toList();

      CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

      ExecutionResult result = summarizeResults(futures.stream()
          .map(CompletableFuture::join)
          .toList());

      long duration = System.currentTimeMillis() - startTime;

      log.info()
          .message("Processamento de batch completado")
          .operation("execute_due_targets")
          .field("totalTargets", result.total())
          .field("changed", result.changed())
          .field("noChange", result.noChange())
          .field("skipped", result.skipped())
          .field("failed", result.failed())
          .field("successRate", String.format("%.2f%%", result.successRate() * 100))
          .duration(duration)
          .status("completed")
          .log();

      return result;

    } catch (Exception e) {
      long duration = System.currentTimeMillis() - startTime;

      log.error()
          .message("Erro durante processamento de batch")
          .operation("execute_due_targets")
          .exception(e)
          .duration(duration)
          .status("error")
          .log();

      throw e;
    }
  }

  private ExecutionResult summarizeResults(List<RunMonitorUseCase.RunResult> results) {
    int changed = 0;
    int noChange = 0;
    int skipped = 0;
    int failed = 0;

    for (RunMonitorUseCase.RunResult result : results) {
      switch (result.status()) {
        case CHANGED -> changed++;
        case NO_CHANGE -> noChange++;
        case SKIPPED -> skipped++;
        case FAILED -> failed++;
      }
    }

    return new ExecutionResult(changed, noChange, skipped, failed);
  }

  public record ExecutionResult(int changed, int noChange, int skipped, int failed) {
    public int total() {
      return changed + noChange + skipped + failed;
    }

    public int successful() {
      return changed + noChange;
    }

    public double successRate() {
      return total() == 0 ? 1.0 : (double) successful() / total();
    }
  }

  public interface Clock {
      Instant now();
  }
}
