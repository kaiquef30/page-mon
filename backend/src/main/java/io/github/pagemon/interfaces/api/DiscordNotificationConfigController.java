package io.github.pagemon.interfaces.api;

import io.github.pagemon.application.usecases.DisableDiscordConfigUseCase;
import io.github.pagemon.application.usecases.GetDiscordConfigUseCase;
import io.github.pagemon.application.usecases.SendDiscordTestMessageUseCase;
import io.github.pagemon.application.usecases.UpsertDiscordConfigUseCase;
import io.github.pagemon.domain.DiscordNotificationConfig;
import io.github.pagemon.interfaces.api.dto.DiscordConfigResponse;
import io.github.pagemon.interfaces.api.dto.TestDiscordMessageRequest;
import io.github.pagemon.interfaces.api.dto.UpdateDiscordConfigRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications/discord")
public class DiscordNotificationConfigController {

    private final GetDiscordConfigUseCase get;
    private final UpsertDiscordConfigUseCase upsert;
    private final DisableDiscordConfigUseCase disable;
    private final SendDiscordTestMessageUseCase test;

    public DiscordNotificationConfigController(
            GetDiscordConfigUseCase get,
            UpsertDiscordConfigUseCase upsert,
            DisableDiscordConfigUseCase disable,
            SendDiscordTestMessageUseCase test
    ) {
        this.get = get;
        this.upsert = upsert;
        this.disable = disable;
        this.test = test;
    }

    @GetMapping
    public DiscordConfigResponse get() {
        return toResponse(get.execute());
    }

    @PutMapping
    public DiscordConfigResponse put(@RequestBody @Valid UpdateDiscordConfigRequest req) {
        var saved = upsert.execute(req.enabled(), req.webhookUrl(), req.maxDiffChars());
        return toResponse(saved);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disable() {
        disable.execute();
    }

    @PostMapping("/test")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void test(@RequestBody(required = false) TestDiscordMessageRequest req) {
        test.execute(req == null ? null : req.message());
    }

    private static DiscordConfigResponse toResponse(DiscordNotificationConfig cfg) {
        return new DiscordConfigResponse(cfg.enabled(), mask(cfg.webhookUrl()), cfg.maxDiffChars());
    }

    private static String mask(String url) {
        if (url == null || url.isBlank()) return null;
        int keep = Math.min(url.length(), 24);
        return url.substring(0, keep) + "…";
    }
}
