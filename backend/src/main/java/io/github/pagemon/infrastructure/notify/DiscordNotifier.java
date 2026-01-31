package io.github.pagemon.infrastructure.notify;

import io.github.pagemon.application.ports.Notifier;
import io.github.pagemon.domain.ChangeEvent;
import io.github.pagemon.domain.WatchTarget;
import org.springframework.stereotype.Component;

@Component
public class DiscordNotifier implements Notifier {

    private final DiscordChangeNotifier discord;

    public DiscordNotifier(DiscordChangeNotifier discord) {
        this.discord = discord;
    }

    @Override
    public void notifyChange(WatchTarget target, ChangeEvent event) {
        discord.notifyChange(
                target.name(),
                target.url().toString(),
                event.unifiedDiff(),
                event.addedLines(),
                event.removedLines()
        );
    }
}
