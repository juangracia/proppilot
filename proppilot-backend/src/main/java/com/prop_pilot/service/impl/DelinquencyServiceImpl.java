package com.prop_pilot.service.impl;

import com.prop_pilot.dto.DelinquencyReport;
import com.prop_pilot.dto.DelinquentLease;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Tenant;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.repository.PaymentRepository;
import com.prop_pilot.service.DelinquencyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Rent is paid in advance: installment k is due on startDate.plusMonths(k), no grace days.
 * Only PAID RENT payments count. Payments are applied oldest installment first.
 */
@Service
public class DelinquencyServiceImpl implements DelinquencyService {

    private final LeaseRepository leaseRepository;
    private final PaymentRepository paymentRepository;

    public DelinquencyServiceImpl(LeaseRepository leaseRepository, PaymentRepository paymentRepository) {
        this.leaseRepository = leaseRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DelinquencyReport getReport(Long ownerId, LocalDate asOf) {
        Map<Long, BigDecimal> paidByLease = new HashMap<>();
        for (Object[] row : paymentRepository.sumPaidRentByLeaseForOwner(ownerId, asOf)) {
            paidByLease.put((Long) row[0], (BigDecimal) row[1]);
        }

        List<DelinquentLease> items = leaseRepository
            .findByStatusAndOwnerIdAndDeletedFalse(Lease.LeaseStatus.ACTIVE, ownerId).stream()
            .map(lease -> toDelinquent(lease, paidByLease.getOrDefault(lease.getId(), BigDecimal.ZERO), asOf))
            .flatMap(Optional::stream)
            .sorted(Comparator.comparingLong(DelinquentLease::daysOverdue).reversed()
                .thenComparing(DelinquentLease::amountOwed, Comparator.reverseOrder()))
            .toList();

        BigDecimal total = items.stream().map(DelinquentLease::amountOwed).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DelinquencyReport(asOf, total, items.size(), items);
    }

    private Optional<DelinquentLease> toDelinquent(Lease lease, BigDecimal paid, LocalDate asOf) {
        BigDecimal rent = lease.getMonthlyRent();
        LocalDate lastDue = asOf.isBefore(lease.getEndDate()) ? asOf : lease.getEndDate();

        int dueCount = 0;
        while (!lease.getStartDate().plusMonths(dueCount).isAfter(lastDue)) {
            dueCount++;
        }

        BigDecimal owed = rent.multiply(BigDecimal.valueOf(dueCount)).subtract(paid);
        if (owed.signum() <= 0) {
            return Optional.empty();
        }

        int covered = paid.divideToIntegralValue(rent).setScale(0, RoundingMode.DOWN).intValue();
        LocalDate oldestDue = lease.getStartDate().plusMonths(covered);
        long days = ChronoUnit.DAYS.between(oldestDue, asOf);
        if (days < 1) {
            return Optional.empty();
        }

        List<String> names = lease.getTenants().stream()
            .sorted(Comparator.comparing(Tenant::getId, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(Tenant::getFullName).toList();
        return Optional.of(new DelinquentLease(
            lease.getId(),
            lease.getPropertyUnit().getId(),
            lease.getPropertyUnit().getAddress(),
            names,
            rent,
            dueCount - covered,
            oldestDue,
            days,
            owed));
    }
}
