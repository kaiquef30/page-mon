package io.github.pagemon.interfaces.api;

import io.github.pagemon.application.ports.ChangeStore;
import io.github.pagemon.application.ports.SnapshotStore;
import io.github.pagemon.application.ports.TargetStore;
import io.github.pagemon.application.usecases.CreateTargetUseCase;
import io.github.pagemon.application.usecases.DeleteTargetUseCase;
import io.github.pagemon.application.usecases.RunMonitorUseCase;
import io.github.pagemon.application.usecases.UpdateTargetUseCase;
import io.github.pagemon.domain.WatchTarget;
import io.github.pagemon.infrastructure.logging.LoggingContext;
import io.github.pagemon.infrastructure.logging.StructuredLogger;
import io.github.pagemon.interfaces.api.dto.ChangeDtos;
import io.github.pagemon.interfaces.api.dto.SnapshotDtos;
import io.github.pagemon.interfaces.api.dto.TargetDtos;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/targets")
public class TargetController {

  private static final StructuredLogger log = StructuredLogger.forClass(TargetController.class);

  private final TargetStore targets;
  private final SnapshotStore snapshots;
  private final ChangeStore changes;
  private final CreateTargetUseCase create;
  private final UpdateTargetUseCase update;
  private final DeleteTargetUseCase delete;
  private final RunMonitorUseCase runner;

  public TargetController(
      TargetStore targets,
      SnapshotStore snapshots,
      ChangeStore changes,
      CreateTargetUseCase create,
      UpdateTargetUseCase update,
      DeleteTargetUseCase delete,
      RunMonitorUseCase runner
  ) {
    this.targets = targets;
    this.snapshots = snapshots;
    this.changes = changes;
    this.create = create;
    this.update = update;
    this.delete = delete;
    this.runner = runner;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public TargetDtos.Response create(@Valid @RequestBody TargetDtos.CreateRequest req) {
    log.info()
        .message("Creating new monitoring target")
        .field("name", req.name())
        .field("url", req.url())
        .field("fetchMode", req.fetchMode())
        .field("enabled", req.enabled() == null || req.enabled())
        .log();

    Duration interval = req.intervalSeconds() == null ? null : Duration.ofSeconds(req.intervalSeconds());
    boolean enabled = req.enabled() == null || req.enabled();
    WatchTarget t = create.execute(req.name(), req.url(), enabled, req.fetchMode(), req.cssSelector(), req.ignoreRegexes(), interval);

    LoggingContext.setTarget(t.id(), t.url().toString());

    log.info()
        .message("Target created successfully")
        .field("targetId", t.id())
        .field("name", t.name())
        .field("url", t.url().toString())
        .status("created")
        .log();

    return TargetDtos.Response.fromDomain(t);
  }

  @GetMapping
  public List<TargetDtos.Response> list() {
    return targets.findAll().stream().map(TargetDtos.Response::fromDomain).toList();
  }

  @GetMapping("/{id}")
  public TargetDtos.Response get(@PathVariable UUID id) {
    return targets.findById(id).map(TargetDtos.Response::fromDomain)
        .orElseThrow(() -> new UpdateTargetUseCase.NotFound("Target not found: " + id));
  }

  @PatchMapping("/{id}")
  public TargetDtos.Response patch(@PathVariable UUID id, @Valid @RequestBody TargetDtos.PatchRequest req) {
    Duration interval = req.intervalSeconds() == null ? null : Duration.ofSeconds(req.intervalSeconds());
    var patch = new UpdateTargetUseCase.Patch(req.name(), req.url(), req.enabled(), req.fetchMode(), req.cssSelector(), req.ignoreRegexes(), interval);
    return TargetDtos.Response.fromDomain(update.execute(id, patch));
  }

  @PostMapping("/{id}:run")
  public RunMonitorUseCase.RunResult run(@PathVariable UUID id, @RequestParam(defaultValue = "true") boolean force) {
    LoggingContext.put(LoggingContext.TARGET_ID, id.toString());

    log.info()
        .message("Executing manual monitoring")
        .field("targetId", id)
        .field("force", force)
        .log();

    long startTime = System.currentTimeMillis();
    RunMonitorUseCase.RunResult result = runner.run(id, force);

    log.info()
        .message("Manual monitoring completed")
        .field("targetId", id)
        .field("result", result.status().name())
        .duration(System.currentTimeMillis() - startTime)
        .log();

    return result;
  }

  @PostMapping("/{id}/run")
  public RunMonitorUseCase.RunResult runAlias(@PathVariable UUID id, @RequestParam(defaultValue = "true") boolean force) {
    return runner.run(id, force);
  }

  @GetMapping("/{id}/snapshots")
  public List<SnapshotDtos.Response> snapshots(@PathVariable UUID id, @RequestParam(defaultValue = "20") int limit) {
    return snapshots.findByTargetId(id, limit).stream().map(SnapshotDtos.Response::fromDomain).toList();
  }

  @GetMapping("/{id}/changes")
  public List<ChangeDtos.Response> changes(@PathVariable UUID id, @RequestParam(defaultValue = "20") int limit) {
    return changes.findByTargetId(id, limit).stream().map(ChangeDtos.Response::fromDomain).toList();
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id) {
    LoggingContext.put(LoggingContext.TARGET_ID, id.toString());

    log.info()
        .message("Deleting target")
        .field("targetId", id)
        .log();

    delete.execute(id);

    log.info()
        .message("Target deleted successfully")
        .field("targetId", id)
        .status("deleted")
        .log();
  }
}
