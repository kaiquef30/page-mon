package io.github.pagemon.infrastructure.fetch;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.WaitUntilState;
import io.github.pagemon.application.ports.FetchResult;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

@Component
public class PlaywrightClient implements AutoCloseable {

    private final Playwright playwright;
    private final Browser browser;
    private final Duration timeout;

    public PlaywrightClient(FetchSettings settings) {
        this.timeout = settings.timeout();

        this.playwright = Playwright.create();
        this.browser = playwright.chromium().launch(
                new BrowserType.LaunchOptions()
                        .setHeadless(true)
        );
    }

    public FetchResult fetch(URI uri) {
        try (BrowserContext browserContext = browser.newContext()) {
            Page page = browserContext.newPage();
            page.setDefaultNavigationTimeout(timeout.toMillis());
            page.setDefaultTimeout(timeout.toMillis());

            Response response = page.navigate(
                    uri.toString(),
                    new Page.NavigateOptions().setWaitUntil(WaitUntilState.NETWORKIDLE)
            );

            if (response == null) {
                throw new RuntimeException("Playwright did not return Response for navigation: " + uri);
            }

            String html = page.content();

            int status = response.status();
            String etag = headerIgnoreCase(response.headers(), "etag");
            String lastModified = headerIgnoreCase(response.headers(), "last-modified");

            return new FetchResult(status, etag, lastModified, html);

        } catch (PlaywrightException e) {
            throw new RuntimeException("Failed to load via Playwright: " + e.getMessage(), e);
        }
    }

    private static String headerIgnoreCase(Map<String, String> headers, String key) {
        if (headers == null || headers.isEmpty() || key == null) return null;
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(key)) {
                return entry.getValue();
            }
        }
        return null;
    }

    @Override
    public void close() {
        try { browser.close(); } catch (Exception ignored) {}
        try { playwright.close(); } catch (Exception ignored) {}
    }
}
