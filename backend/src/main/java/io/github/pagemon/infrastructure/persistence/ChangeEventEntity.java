package io.github.pagemon.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "change_event",
        indexes = {
                @Index(name = "idx_change_event_target_created", columnList = "target_id,created_at")
        }
)
public class ChangeEventEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "target_id", nullable = false, columnDefinition = "uuid")
    private UUID targetId;

    @Column(name = "created_at", nullable = false, columnDefinition = "timestamp")
    private Instant createdAt;

    @Column(name = "old_snapshot_id", columnDefinition = "uuid")
    private UUID oldSnapshotId;

    @Column(name = "new_snapshot_id", nullable = false, columnDefinition = "uuid")
    private UUID newSnapshotId;

    @Column(name = "added_lines", nullable = false)
    private int addedLines;

    @Column(name = "removed_lines", nullable = false)
    private int removedLines;

    @Lob
    @Column(name = "unified_diff", nullable = false)
    private String unifiedDiff;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTargetId() { return targetId; }
    public void setTargetId(UUID targetId) { this.targetId = targetId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public UUID getOldSnapshotId() { return oldSnapshotId; }
    public void setOldSnapshotId(UUID oldSnapshotId) { this.oldSnapshotId = oldSnapshotId; }

    public UUID getNewSnapshotId() { return newSnapshotId; }
    public void setNewSnapshotId(UUID newSnapshotId) { this.newSnapshotId = newSnapshotId; }

    public int getAddedLines() { return addedLines; }
    public void setAddedLines(int addedLines) { this.addedLines = addedLines; }

    public int getRemovedLines() { return removedLines; }
    public void setRemovedLines(int removedLines) { this.removedLines = removedLines; }

    public String getUnifiedDiff() { return unifiedDiff; }
    public void setUnifiedDiff(String unifiedDiff) { this.unifiedDiff = unifiedDiff; }
}
