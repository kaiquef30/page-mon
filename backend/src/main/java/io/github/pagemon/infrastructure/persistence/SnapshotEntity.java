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
        name = "snapshot",
        indexes = {
                @Index(name = "idx_snapshot_target_fetched", columnList = "target_id,fetched_at")
        }
)
public class SnapshotEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "target_id", nullable = false, columnDefinition = "uuid")
    private UUID targetId;

    @Column(name = "fetched_at", nullable = false, columnDefinition = "timestamp")
    private Instant fetchedAt;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "etag")
    private String etag;

    @Column(name = "last_modified")
    private String lastModified;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Lob
    @Column(name = "normalized_text", nullable = false)
    private String normalizedText;

    @Lob
    @Column(name = "raw_html")
    private String rawHtml;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTargetId() { return targetId; }
    public void setTargetId(UUID targetId) { this.targetId = targetId; }

    public Instant getFetchedAt() { return fetchedAt; }
    public void setFetchedAt(Instant fetchedAt) { this.fetchedAt = fetchedAt; }

    public Integer getHttpStatus() { return httpStatus; }
    public void setHttpStatus(Integer httpStatus) { this.httpStatus = httpStatus; }

    public String getEtag() { return etag; }
    public void setEtag(String etag) { this.etag = etag; }

    public String getLastModified() { return lastModified; }
    public void setLastModified(String lastModified) { this.lastModified = lastModified; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public String getNormalizedText() { return normalizedText; }
    public void setNormalizedText(String normalizedText) { this.normalizedText = normalizedText; }

    public String getRawHtml() { return rawHtml; }
    public void setRawHtml(String rawHtml) { this.rawHtml = rawHtml; }
}
