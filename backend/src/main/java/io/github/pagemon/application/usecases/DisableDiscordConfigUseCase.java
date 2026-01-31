package io.github.pagemon.application.usecases;

import io.github.pagemon.domain.NotificationConfigRepository;

public class DisableDiscordConfigUseCase {

    private final NotificationConfigRepository repo;

    public DisableDiscordConfigUseCase(NotificationConfigRepository repo) {
        this.repo = repo;
    }

    public void execute() {
        repo.disableDiscord();
    }
}
