package io.github.pagemon.interfaces.api.dto;

public record DiscordConfigResponse(
        boolean enabled,
        String webhookUrlMasked,
        int maxDiffChars
) { }
