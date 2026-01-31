package io.github.pagemon.interfaces.api;

import io.github.pagemon.application.ports.ChangeStore;
import io.github.pagemon.interfaces.api.dto.ChangeDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/changes")
public class ChangeController {

  private final ChangeStore store;

  public ChangeController(ChangeStore store) { this.store = store; }

  @GetMapping
  public List<ChangeDtos.Response> list(
      @RequestParam(name = "targetId", required = false) UUID targetId,
      @RequestParam(name = "limit", defaultValue = "20") int limit
  ) {
    var safeLimit = Math.max(1, Math.min(limit, 200));
    var events = (targetId == null)
        ? store.findRecent(safeLimit)
        : store.findByTargetId(targetId, safeLimit);
    return events.stream().map(ChangeDtos.Response::fromDomain).toList();
  }

  @GetMapping("/{id}")
  public ChangeDtos.Response get(@PathVariable UUID id) {
    return store.findById(id)
        .map(ChangeDtos.Response::fromDomain)
        .orElseThrow(() -> new IllegalArgumentException("ChangeEvent not found: " + id));
  }
}
