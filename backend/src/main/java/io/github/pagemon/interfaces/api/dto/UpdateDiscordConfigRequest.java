package io.github.pagemon.interfaces.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateDiscordConfigRequest(
        @NotNull
        Boolean enabled,
        String webhookUrl,
        @Min(200)
        @Max(10000)
        Integer maxDiffChars
) { }
