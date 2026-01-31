package io.github.pagemon.infrastructure.persistence;

import io.github.pagemon.domain.NotificationChannel;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification")
public class NotificationtEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 32)
    private NotificationChannel channel;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "webhook_url", length = 2048)
    private String webhookUrl;

    @Column(name = "max_diff_chars", nullable = false)
    private int maxDiffChars;

    @Column(name = "created_at", nullable = false, columnDefinition = "timestamp")
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, columnDefinition = "timestamp")
    private Instant updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public NotificationChannel getChannel() { return channel; }
    public void setChannel(NotificationChannel channel) { this.channel = channel; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getWebhookUrl() { return webhookUrl; }
    public void setWebhookUrl(String webhookUrl) { this.webhookUrl = webhookUrl; }

    public int getMaxDiffChars() { return maxDiffChars; }
    public void setMaxDiffChars(int maxDiffChars) { this.maxDiffChars = maxDiffChars; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

}
