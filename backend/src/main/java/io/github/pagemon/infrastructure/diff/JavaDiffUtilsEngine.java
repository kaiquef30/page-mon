package io.github.pagemon.infrastructure.diff;

import io.github.pagemon.application.usecases.RunMonitorUseCase.DiffEngine;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

import com.github.difflib.UnifiedDiffUtils;
import com.github.difflib.patch.Patch;

import static com.github.difflib.DiffUtils.diff;

@Component
public class JavaDiffUtilsEngine implements DiffEngine {

  @Override
  public DiffResult unifiedDiff(String oldText, String newText, String title) {
    List<String> original = splitLines(oldText);
    List<String> revised = splitLines(newText);

    Patch<String> patch = diff(original, revised);

    List<String> unified = UnifiedDiffUtils.generateUnifiedDiff(
        safeTitle(title) + ":before",
        safeTitle(title) + ":after",
        original,
        patch,
        3
    );

    int added = 0;
    int removed = 0;
    for (var delta : patch.getDeltas()) {
      added += delta.getTarget().size();
      removed += delta.getSource().size();
    }

    return new DiffResult(added, removed, String.join("\n", unified));
  }

  private List<String> splitLines(String text) {
    if (text == null || text.isBlank()) return List.of();
    return Arrays.asList(text.replace("\r\n", "\n").replace("\r", "\n").split("\n"));
  }

  private String safeTitle(String title) {
    if (title == null || title.isBlank()) return "page";
    return title.replaceAll("[\n\r\t]", " ").strip();
  }
}
