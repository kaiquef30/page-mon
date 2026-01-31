package io.github.pagemon.application.usecases;

import io.github.pagemon.domain.DiscordNotificationConfig;
import io.github.pagemon.domain.NotificationConfigRepository;

public class GetDiscordConfigUseCase {

    private final NotificationConfigRepository repo;

    public GetDiscordConfigUseCase(NotificationConfigRepository repo) {
        this.repo = repo;
    }

    public DiscordNotificationConfig execute() {
        return repo.getDiscord();
    }
}
