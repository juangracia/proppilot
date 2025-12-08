package com.prop_pilot.scheduler;

import com.prop_pilot.service.IndexValueService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class IndexFetchScheduler {

    private final IndexValueService indexValueService;

    public IndexFetchScheduler(IndexValueService indexValueService) {
        this.indexValueService = indexValueService;
    }

    /**
     * Fetch dollar rates hourly during Argentine market hours (10:00-18:00 ART)
     * Runs Monday to Friday
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 0 10-18 * * MON-FRI", zone = "America/Argentina/Buenos_Aires")
    public void fetchDollarRatesHourly() {
        log.info("Scheduled task: Fetching dollar rates (hourly during market hours)");
        try {
            indexValueService.refreshIndicesForCountry("AR");
        } catch (Exception e) {
            log.error("Error in scheduled dollar rate fetch: {}", e.getMessage(), e);
        }
    }

    /**
     * Fetch ICL daily at 10:00 ART (BCRA publishes in the morning)
     * Runs Monday to Friday
     */
    @Scheduled(cron = "0 0 10 * * MON-FRI", zone = "America/Argentina/Buenos_Aires")
    public void fetchIclDaily() {
        log.info("Scheduled task: Fetching ICL (daily)");
        try {
            indexValueService.refreshIndicesForCountry("AR");
        } catch (Exception e) {
            log.error("Error in scheduled ICL fetch: {}", e.getMessage(), e);
        }
    }

    /**
     * Fetch IPC daily at 17:00 ART (INDEC publishes mid-month at 16:00)
     * Runs every day to check for new monthly data
     */
    @Scheduled(cron = "0 0 17 * * *", zone = "America/Argentina/Buenos_Aires")
    public void fetchIpcDaily() {
        log.info("Scheduled task: Fetching IPC (daily check)");
        try {
            indexValueService.refreshIndicesForCountry("AR");
        } catch (Exception e) {
            log.error("Error in scheduled IPC fetch: {}", e.getMessage(), e);
        }
    }

    /**
     * Initial data load on application startup
     * Runs once after 30 seconds delay to allow application to fully start
     */
    @Scheduled(initialDelay = 30000, fixedDelay = Long.MAX_VALUE)
    public void initialDataLoad() {
        log.info("Scheduled task: Initial index data load on startup");
        try {
            indexValueService.refreshAllIndices();
            log.info("Initial index data load completed");
        } catch (Exception e) {
            log.error("Error in initial index data load: {}", e.getMessage(), e);
        }
    }
}
