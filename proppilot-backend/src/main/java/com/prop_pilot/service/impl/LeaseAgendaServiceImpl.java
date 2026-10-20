package com.prop_pilot.service.impl;

import com.prop_pilot.dto.AdjustedRentResponse;
import com.prop_pilot.dto.AgendaEvent;
import com.prop_pilot.dto.AgendaResponse;
import com.prop_pilot.dto.AgendaSummary;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.entity.Lease.LeaseStatus;
import com.prop_pilot.exception.BusinessLogicException;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.service.LeaseAgendaService;
import com.prop_pilot.service.RentAdjustmentService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class LeaseAgendaServiceImpl implements LeaseAgendaService {

    static final int MIN_HORIZON_DAYS = 1;
    static final int MAX_HORIZON_DAYS = 730;
    static final int SUMMARY_WINDOW_DAYS = 90;

    private static final String TYPE_END = "END";
    private static final String TYPE_ADJUSTMENT = "ADJUSTMENT";
    private static final Set<AdjustmentIndex> ADJUSTABLE =
        EnumSet.of(AdjustmentIndex.ICL, AdjustmentIndex.IPC);

    private final LeaseRepository leaseRepository;
    private final RentAdjustmentService rentAdjustmentService;

    public LeaseAgendaServiceImpl(LeaseRepository leaseRepository,
                                  RentAdjustmentService rentAdjustmentService) {
        this.leaseRepository = leaseRepository;
        this.rentAdjustmentService = rentAdjustmentService;
    }

    @Override
    public AgendaResponse compute(Long ownerId, LocalDate asOf, int horizonDays) {
        if (horizonDays < MIN_HORIZON_DAYS || horizonDays > MAX_HORIZON_DAYS) {
            throw new BusinessLogicException("El horizonte debe estar entre "
                + MIN_HORIZON_DAYS + " y " + MAX_HORIZON_DAYS + " días");
        }
        LocalDate horizonEnd = asOf.plusDays(horizonDays);
        // The summary must not depend on the requested horizon, so events are built for at least 90 days
        // and only the returned list is cut back to the horizon.
        LocalDate buildEnd = asOf.plusDays(Math.max(horizonDays, SUMMARY_WINDOW_DAYS));

        List<AgendaEvent> events = new ArrayList<>();
        for (Lease lease : leaseRepository.findByStatusAndOwnerIdAndDeletedFalse(LeaseStatus.ACTIVE, ownerId)) {
            if (lease.getStatus() != LeaseStatus.ACTIVE) {
                continue;
            }
            if (!lease.getEndDate().isAfter(buildEnd)) {
                events.add(endEvent(lease, asOf));
            }
            events.addAll(adjustmentEvents(lease, ownerId, asOf, buildEnd));
        }
        events.sort(Comparator
            .comparing((AgendaEvent e) -> !"EXPIRED".equals(e.alertLevel()))
            .thenComparing(AgendaEvent::date));

        AgendaSummary summary = summarize(events, asOf);
        List<AgendaEvent> inHorizon = events.stream().filter(e -> !e.date().isAfter(horizonEnd)).toList();
        return new AgendaResponse(asOf, horizonDays, summary, inHorizon);
    }

    private AgendaEvent endEvent(Lease lease, LocalDate asOf) {
        long days = ChronoUnit.DAYS.between(asOf, lease.getEndDate());
        return new AgendaEvent(lease.getId(), TYPE_END, lease.getEndDate(), days, endAlertLevel(days),
            lease.getPropertyAddress(), lease.getTenantName(), lease.getMonthlyRent(),
            null, lease.getAdjustmentIndex().name(), null);
    }

    private List<AgendaEvent> adjustmentEvents(Lease lease, Long ownerId, LocalDate asOf, LocalDate horizonEnd) {
        Integer freq = lease.getAdjustmentFrequencyMonths();
        if (!ADJUSTABLE.contains(lease.getAdjustmentIndex()) || freq == null || freq <= 0) {
            return List.of();
        }
        LocalDate limit = lease.getEndDate().isBefore(horizonEnd) ? lease.getEndDate() : horizonEnd;
        List<LocalDate> dates = new ArrayList<>();
        // k * freq months from the start date each time, so a day-31 start does not drift
        for (int k = 1; ; k++) {
            LocalDate date = lease.getStartDate().plusMonths((long) k * freq);
            if (date.isAfter(limit)) {
                break;
            }
            if (date.isAfter(asOf)) {
                dates.add(date);
            }
        }
        if (dates.isEmpty()) {
            return List.of();
        }
        // one lookup per lease, reused for every adjustment event of that lease
        AdjustedRentResponse adjusted = rentAdjustmentService.computeAdjustedRent(lease.getId(), ownerId, asOf);
        var estimated = adjusted.hasAdjustment() ? adjusted.adjustedAmount() : null;
        var indexDate = adjusted.hasAdjustment() ? adjusted.indexDate() : null;

        List<AgendaEvent> result = new ArrayList<>();
        for (LocalDate date : dates) {
            long days = ChronoUnit.DAYS.between(asOf, date);
            result.add(new AgendaEvent(lease.getId(), TYPE_ADJUSTMENT, date, days, days <= 30 ? "D30" : "NONE",
                lease.getPropertyAddress(), lease.getTenantName(), lease.getMonthlyRent(),
                estimated, lease.getAdjustmentIndex().name(), indexDate));
        }
        return result;
    }

    static String endAlertLevel(long daysUntil) {
        if (daysUntil < 0) return "EXPIRED";
        if (daysUntil <= 30) return "D30";
        if (daysUntil <= 60) return "D60";
        if (daysUntil <= 90) return "D90";
        return "NONE";
    }

    private AgendaSummary summarize(List<AgendaEvent> events, LocalDate asOf) {
        YearMonth thisMonth = YearMonth.from(asOf);
        int expiring = 0;
        int adjustments = 0;
        int expired = 0;
        for (AgendaEvent e : events) {
            if (TYPE_END.equals(e.type())) {
                if (e.daysUntil() < 0) expired++;
                else if (e.daysUntil() <= 90) expiring++;
            } else if (YearMonth.from(e.date()).equals(thisMonth)) {
                adjustments++;
            }
        }
        return new AgendaSummary(expiring, adjustments, expired);
    }
}
