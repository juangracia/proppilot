package com.prop_pilot.service.impl;

import com.prop_pilot.dto.AdjustedRentResponse;
import com.prop_pilot.dto.AlertCounts;
import com.prop_pilot.dto.LeaseAgendaItem;
import com.prop_pilot.dto.LeaseAgendaResponse;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.entity.Lease.LeaseStatus;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.service.LeaseAgendaService;
import com.prop_pilot.service.RentAdjustmentService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class LeaseAgendaServiceImpl implements LeaseAgendaService {

    private static final int WINDOW_MONTHS = 5;
    private static final int MONTHS_BEFORE_TODAY = 1;
    private static final int DEFAULT_FREQUENCY_MONTHS = 12;

    private static final String NONE = "NONE";
    private static final String D90 = "D90";
    private static final String D60 = "D60";
    private static final String D30 = "D30";
    private static final String ENDED = "ENDED";

    private final LeaseRepository leaseRepository;
    private final RentAdjustmentService rentAdjustmentService;

    public LeaseAgendaServiceImpl(LeaseRepository leaseRepository, RentAdjustmentService rentAdjustmentService) {
        this.leaseRepository = leaseRepository;
        this.rentAdjustmentService = rentAdjustmentService;
    }

    @Override
    public LeaseAgendaResponse getAgenda(Long ownerId, LocalDate today) {
        YearMonth first = YearMonth.from(today).minusMonths(MONTHS_BEFORE_TODAY);
        LocalDate windowStart = first.atDay(1);
        LocalDate windowEnd = first.plusMonths(WINDOW_MONTHS - 1L).atEndOfMonth();

        List<String> months = new ArrayList<>();
        for (int i = 0; i < WINDOW_MONTHS; i++) {
            months.add(first.plusMonths(i).toString());
        }

        List<LeaseAgendaItem> items = leaseRepository.findByOwnerIdAndDeletedFalse(ownerId).stream()
            .filter(l -> !l.isDeleted() && l.getStatus() == LeaseStatus.ACTIVE)
            .sorted(Comparator.comparing(Lease::getEndDate).thenComparing(Lease::getId))
            .map(l -> toItem(l, today, windowStart, windowEnd))
            .toList();

        return new LeaseAgendaResponse(today, months, items, countAlerts(items));
    }

    private LeaseAgendaItem toItem(Lease lease, LocalDate today, LocalDate windowStart, LocalDate windowEnd) {
        long daysToEnd = ChronoUnit.DAYS.between(today, lease.getEndDate());
        AdjustmentIndex idx = lease.getAdjustmentIndex();

        LocalDate next = null;
        List<LocalDate> inWindow = new ArrayList<>();
        if (idx != AdjustmentIndex.NONE) {
            int freq = frequencyOf(lease);
            for (int k = 1; ; k++) {
                LocalDate d = lease.getStartDate().plusMonths((long) k * freq);
                if (!d.isBefore(lease.getEndDate()) || (d.isAfter(windowEnd) && next != null)) {
                    break;
                }
                if (next == null && !d.isBefore(today)) {
                    next = d;
                }
                if (!d.isBefore(windowStart) && !d.isAfter(windowEnd)) {
                    inWindow.add(d);
                }
            }
        }

        AdjustedRentResponse estimate = next != null ? rentAdjustmentService.computeAdjustedRent(lease, next) : null;
        boolean available = estimate != null && estimate.hasAdjustment();

        return new LeaseAgendaItem(
            lease.getId(),
            lease.getPropertyAddress(),
            lease.getTenantNames(),
            lease.getStartDate(),
            lease.getEndDate(),
            lease.getMonthlyRent(),
            daysToEnd,
            alertLevel(daysToEnd),
            idx.name(),
            lease.getAdjustmentFrequencyMonths(),
            next,
            inWindow,
            available ? estimate.adjustedAmount() : null,
            available ? estimate.factor() : null,
            available ? estimate.indexDate() : null,
            available
        );
    }

    private int frequencyOf(Lease lease) {
        Integer freq = lease.getAdjustmentFrequencyMonths();
        return freq == null || freq < 1 ? DEFAULT_FREQUENCY_MONTHS : freq;
    }

    private String alertLevel(long daysToEnd) {
        if (daysToEnd < 0) return ENDED;
        if (daysToEnd <= 30) return D30;
        if (daysToEnd <= 60) return D60;
        if (daysToEnd <= 90) return D90;
        return NONE;
    }

    private AlertCounts countAlerts(List<LeaseAgendaItem> items) {
        return new AlertCounts(
            count(items, D90), count(items, D60), count(items, D30), count(items, ENDED));
    }

    private int count(List<LeaseAgendaItem> items, String level) {
        return (int) items.stream().filter(i -> Objects.equals(i.alertLevel(), level)).count();
    }
}
