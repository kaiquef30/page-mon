package io.github.pagemon.domain;

public record DiscordNotificationConfig(
        boolean enabled,
        String webhookUrl,
        int maxDiffChars
) {
    public static DiscordNotificationConfig disabledDefault() {
        return new DiscordNotificationConfig(false, null, 1500);
    }
}
