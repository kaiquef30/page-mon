package io.github.pagemon.application.usecases;

import io.github.pagemon.application.ports.DiscordWebhookClient;
import io.github.pagemon.domain.NotificationConfigRepository;

public class SendDiscordTestMessageUseCase {

    private final NotificationConfigRepository repo;
    private final DiscordWebhookClient client;

    public SendDiscordTestMessageUseCase(NotificationConfigRepository repo, DiscordWebhookClient client) {
        this.repo = repo;
        this.client = client;
    }

    public void execute(String messageOverride) {
        var cfg = repo.getDiscord();
        if (!cfg.enabled() || !hasText(cfg.webhookUrl())) {
            throw new IllegalStateException("Discord is disabled or without configured webhook.");
        }

        String msg = hasText(messageOverride)
                ? messageOverride
                : "Test: page-change-monitor notifications OK.";

        client.send(cfg.webhookUrl(), msg);
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
