package io.github.pagemon.interfaces.scheduler;

import io.github.pagemon.application.usecases.RunDueTargetsUseCase;
import io.github.pagemon.infrastructure.logging.LoggingContext;
import io.github.pagemon.infrastructure.logging.StructuredLogger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DueTargetsScheduler {
    private static final StructuredLogger log = StructuredLogger.forClass(DueTargetsScheduler.class);

    private final RunDueTargetsUseCase useCase;
    private final int batchSize;

    public DueTargetsScheduler(RunDueTargetsUseCase useCase,
                               @Value("${monitor.scheduler.batch-size:50}") int batchSize) {
        this.useCase = useCase;
        this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${monitor.scheduler.fixed-delay:PT30S}")
    public void tick() {
        String executionId = LoggingContext.initSchedulerContext("DueTargetsScheduler");
        LoggingContext.setOperation("scheduler_tick");

        try {
            long startTime = System.currentTimeMillis();
            int processedCount = useCase.execute(batchSize);
            long duration = System.currentTimeMillis() - startTime;

            if (processedCount > 0) {
                log.info()
                    .message("Scheduler tick completed")
                    .component("DueTargetsScheduler")
                    .operation("scheduler_tick")
                    .field("processedTargets", processedCount)
                    .field("batchSize", batchSize)
                    .duration(duration)
                    .status("success")
                    .log();
            }
        } catch (Exception e) {
            log.error()
                .message("Error during scheduler execution")
                .component("DueTargetsScheduler")
                .operation("scheduler_tick")
                .exception(e)
                .status("error")
                .log();
        } finally {
            LoggingContext.clear();
        }
    }
}
