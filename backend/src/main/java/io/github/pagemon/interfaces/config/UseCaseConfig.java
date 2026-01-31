package io.github.pagemon.interfaces.config;

import io.github.pagemon.application.config.ExecutorSettings;
import io.github.pagemon.application.ports.*;
import io.github.pagemon.application.usecases.*;
import io.github.pagemon.domain.NotificationConfigRepository;
import io.github.pagemon.infrastructure.diff.JavaDiffUtilsEngine;
import io.github.pagemon.infrastructure.extract.JsoupContentExtractor;
import io.github.pagemon.infrastructure.logging.MdcExecutorService;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableConfigurationProperties(ExecutorSettings.class)
public class UseCaseConfig {

    @Bean
    public CreateTargetUseCase createTargetUseCase(TargetStore store, ClockPort clockPort) {
        return new CreateTargetUseCase(store, clockPort::now);
    }

    @Bean
    public UpdateTargetUseCase updateTargetUseCase(TargetStore store, ClockPort clockPort) {
        return new UpdateTargetUseCase(store, clockPort::now);
    }

    @Bean
    public DeleteTargetUseCase deleteTargetUseCase(TargetStore targets, SnapshotStore snapshots, ChangeStore changes) {
        return new DeleteTargetUseCase(targets, snapshots, changes);
    }

    @Bean
    public RunMonitorUseCase runMonitorUseCase(
            TargetStore targets,
            SnapshotStore snapshots,
            ChangeStore changes,
            PageFetcher fetcher,
            Notifier notifier,
            ClockPort clock,
            JavaDiffUtilsEngine diffEngine,
            JsoupContentExtractor extractor,
            LockPort locks
    ) {
        return new RunMonitorUseCase(
                targets, snapshots, changes,
                fetcher, notifier,
                clock, diffEngine,
                extractor, locks
        );
    }

    @Bean(destroyMethod = "shutdown")
    public ExecutorService monitorExecutorService(ExecutorSettings settings) {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                settings.corePoolSize(),
                settings.maxPoolSize(),
                60L,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(settings.queueCapacity()),
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
        return new MdcExecutorService(executor);
    }

    @Bean
    public RunDueTargetsUseCase runDueTargetsUseCase(
            TargetStore targets,
            SnapshotStore snapshots,
            RunMonitorUseCase runner,
            ClockPort clock,
            ExecutorService monitorExecutorService) {
        return new RunDueTargetsUseCase(targets, snapshots, runner, clock::now, monitorExecutorService);
    }

    @Bean
    public GetDiscordConfigUseCase getDiscordConfigUseCase(NotificationConfigRepository repo) {
        return new GetDiscordConfigUseCase(repo);
    }

    @Bean
    public UpsertDiscordConfigUseCase upsertDiscordConfigUseCase(NotificationConfigRepository repo) {
        return new UpsertDiscordConfigUseCase(repo);
    }

    @Bean
    public DisableDiscordConfigUseCase disableDiscordConfigUseCase(NotificationConfigRepository repo) {
        return new DisableDiscordConfigUseCase(repo);
    }

    @Bean
    public SendDiscordTestMessageUseCase sendDiscordTestMessageUseCase(
            NotificationConfigRepository repo,
            DiscordWebhookClient client
    ) {
        return new SendDiscordTestMessageUseCase(repo, client);
    }
}
