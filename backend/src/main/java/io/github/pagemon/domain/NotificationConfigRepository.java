package io.github.pagemon.domain;

public interface NotificationConfigRepository {
    DiscordNotificationConfig getDiscord();
    DiscordNotificationConfig upsertDiscord(DiscordNotificationConfig config);
    void disableDiscord();
}
