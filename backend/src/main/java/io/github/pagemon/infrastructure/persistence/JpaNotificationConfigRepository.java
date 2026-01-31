package io.github.pagemon.infrastructure.persistence;

import io.github.pagemon.domain.DiscordNotificationConfig;
import io.github.pagemon.domain.NotificationChannel;
import io.github.pagemon.domain.NotificationConfigRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Repository
public class JpaNotificationConfigRepository implements NotificationConfigRepository {

    private final SpringDataNotificationRepository repo;

    public JpaNotificationConfigRepository(SpringDataNotificationRepository repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public DiscordNotificationConfig getDiscord() {
       return repo.findByChannel(NotificationChannel.DISCORD)
               .map(e -> new DiscordNotificationConfig(e.isEnabled(), e.getWebhookUrl(), e.getMaxDiffChars()))
               .orElseGet(DiscordNotificationConfig::disabledDefault);
    }

    @Override
    @Transactional
    public DiscordNotificationConfig upsertDiscord(DiscordNotificationConfig config) {
        var now = Instant.now();

        var entity = repo.findByChannel(NotificationChannel.DISCORD).orElseGet(() -> {
            var notificationtEntity = new NotificationtEntity();
            notificationtEntity.setId(UUID.randomUUID());
            notificationtEntity.setChannel(NotificationChannel.DISCORD);
            notificationtEntity.setCreatedAt(now);
            return notificationtEntity;
        });

        entity.setEnabled(config.enabled());
        entity.setWebhookUrl(config.webhookUrl());
        entity.setMaxDiffChars(config.maxDiffChars());
        entity.setUpdatedAt(now);

        repo.save(entity);
        return new DiscordNotificationConfig(entity.isEnabled(), entity.getWebhookUrl(), entity.getMaxDiffChars());

    }

    @Override
    @Transactional
    public void disableDiscord() {
        var now = Instant.now();
        var entity = repo.findByChannel(NotificationChannel.DISCORD).orElseGet(() -> {
            var notificationtEntity = new NotificationtEntity();
            notificationtEntity.setId(UUID.randomUUID());
            notificationtEntity.setChannel(NotificationChannel.DISCORD);
            notificationtEntity.setCreatedAt(now);
            notificationtEntity.setMaxDiffChars(1500);
            return notificationtEntity;
        });

        entity.setEnabled(false);
        entity.setWebhookUrl(null);
        entity.setUpdatedAt(now);
        repo.save(entity);
    }
}
