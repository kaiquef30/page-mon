package io.github.pagemon.infrastructure.notify;

import io.github.pagemon.application.ports.DiscordWebhookClient;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Component
public class DiscordWebhookClientImpl implements DiscordWebhookClient {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(8);

    private final RestClient restClient;

    public DiscordWebhookClientImpl() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) CONNECT_TIMEOUT.toMillis());
        factory.setReadTimeout((int) READ_TIMEOUT.toMillis());

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    @Override
    public void send(String webhookUrl, String content) {
        restClient.post()
                .uri(webhookUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new Payload(content))
                .retrieve()
                .toBodilessEntity();
    }

    private record Payload(String content) { }
}
