package io.github.pagemon.application.ports;

public interface DiscordWebhookClient {
    void send(String webhookUrl, String content);
}
