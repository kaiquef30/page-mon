package io.github.pagemon.application.usecases;

import io.github.pagemon.domain.DiscordNotificationConfig;
import io.github.pagemon.domain.NotificationConfigRepository;

public class UpsertDiscordConfigUseCase {

    private final NotificationConfigRepository repo;

    public UpsertDiscordConfigUseCase(NotificationConfigRepository repo) {
        this.repo = repo;
    }

    public DiscordNotificationConfig execute(Boolean enabled, String webhookUrl, Integer maxDiffChars) {
        boolean on = Boolean.TRUE.equals(enabled);
        int maxChars = (maxDiffChars == null) ? 1500 : maxDiffChars;

        String url = webhookUrl;
        if (on && !hasText(url)) {
            throw new IllegalArgumentException("webhookUrl is required when enabled=true");
        }
        if (!on) url = null;

        return repo.upsertDiscord(new DiscordNotificationConfig(on, url, maxChars));
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
