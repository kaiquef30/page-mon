package io.github.pagemon.infrastructure.notify;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import io.github.pagemon.application.ports.DiscordWebhookClient;
import io.github.pagemon.domain.DiscordNotificationConfig;
import io.github.pagemon.domain.NotificationConfigRepository;
import org.springframework.stereotype.Component;

import java.time.Duration;

import static io.github.pagemon.domain.MonitorConstants.DISCORD_CACHE_TTL;

@Component
public class DiscordChangeNotifier {

    private static final Duration CACHE_TTL = DISCORD_CACHE_TTL;
    private static final String CACHE_KEY = "discord-config";

    private final DiscordWebhookClient client;
    private final LoadingCache<String, DiscordNotificationConfig> configCache;

    public DiscordChangeNotifier(NotificationConfigRepository configRepo, DiscordWebhookClient client) {
        this.client = client;
        this.configCache = Caffeine.newBuilder()
                .expireAfterWrite(CACHE_TTL)
                .maximumSize(1)
                .build(key -> configRepo.getDiscord());
    }

    public void notifyChange(String title, String url, String diffText, int added, int removed) {
        var config = configCache.get(CACHE_KEY);
        if (config == null || !config.enabled() || config.webhookUrl() == null || config.webhookUrl().isBlank()) {
            return;
        }

        String body = buildMessage(title, url, diffText, added, removed, config.maxDiffChars());
        client.send(config.webhookUrl(), body);
    }

    private static String buildMessage(String title, String url, String diffText, int added, int removed, int maxChars) {
        String header = title + "\n" + url + "\n" + "Δ +" + added + " / -" + removed + "\n";
        String diffBlock = "```diff\n" + safeTrim(diffText, maxChars) + "\n```";
        return header + diffBlock;
    }

    private static String safeTrim(String s, int maxChars) {
        if (s == null) return "";
        if (s.length() <= maxChars)
            return s;
        return s.substring(0, Math.max(0, maxChars - 1)) + "…";
    }
}
