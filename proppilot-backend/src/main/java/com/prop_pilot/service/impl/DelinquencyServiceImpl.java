package com.prop_pilot.service.impl;

import com.prop_pilot.dto.DelinquencyItem;
import com.prop_pilot.dto.DelinquencyResponse;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Lease.LeaseStatus;
import com.prop_pilot.entity.Payment;
import com.prop_pilot.entity.Payment.PaymentStatus;
import com.prop_pilot.entity.Payment.PaymentType;
import com.prop_pilot.entity.Tenant;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.repository.PaymentRepository;
import com.prop_pilot.service.DelinquencyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DelinquencyServiceImpl implements DelinquencyService {

    private static final Logger log = LoggerFactory.getLogger(DelinquencyServiceImpl.class);

    static final int DEFAULT_PAYMENT_DUE_DAY = 10;
    static final String BASIS_BASE_RENT = "BASE_RENT";

    private final LeaseRepository leaseRepository;
    private final PaymentRepository paymentRepository;

    public DelinquencyServiceImpl(LeaseRepository leaseRepository, PaymentRepository paymentRepository) {
        this.leaseRepository = leaseRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DelinquencyResponse compute(Long ownerId, LocalDate asOf) {
        List<DelinquencyItem> items = new ArrayList<>();
        for (Lease lease : leaseRepository.findByOwnerIdAndDeletedFalse(ownerId)) {
            if (lease.getStatus() != LeaseStatus.ACTIVE || lease.getStartDate().isAfter(asOf)) {
                continue;
            }
            BigDecimal rent = lease.getMonthlyRent();
            if (rent == null || rent.signum() <= 0) {
                log.warn("Lease {} has no positive monthly rent, skipped in delinquency", lease.getId());
                continue;
            }
            toItem(lease, rent, ownerId, asOf).ifPresent(items::add);
        }
        items.sort(Comparator.comparingLong(DelinquencyItem::daysLate).reversed());
        BigDecimal total = items.stream().map(DelinquencyItem::amountOwed).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DelinquencyResponse(asOf, BASIS_BASE_RENT, total, items.size(), items);
    }

    private Optional<DelinquencyItem> toItem(Lease lease, BigDecimal rent, Long ownerId, LocalDate asOf) {
        List<LocalDate> dueDates = dueDates(lease, asOf);
        if (dueDates.isEmpty()) {
            return Optional.empty();
        }
        BigDecimal paid = paymentRepository.findByLeaseIdAndStatusAndOwnerId(lease.getId(), PaymentStatus.PAID, ownerId)
                .stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID && p.getPaymentType() == PaymentType.RENT)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expected = rent.multiply(BigDecimal.valueOf(dueDates.size()));
        BigDecimal owed = expected.subtract(paid);
        if (owed.signum() <= 0) {
            return Optional.empty();
        }
        // FIFO: payments cover the oldest months first
        BigDecimal[] owedParts = owed.divideAndRemainder(rent);
        int monthsOwed = owedParts[0].intValue();
        int oldestIndex = paid.divideToIntegralValue(rent).intValue();
        LocalDate oldestDue = dueDates.get(oldestIndex);
        List<Tenant> tenants = lease.getTenants().stream()
                .sorted(Comparator.comparing(Tenant::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        String tenantName = tenants.stream().map(Tenant::getFullName).collect(Collectors.joining(", "));
        String tenantPhone = tenants.isEmpty() ? null : tenants.get(0).getPhone();
        return Optional.of(new DelinquencyItem(
                lease.getId(),
                tenantName,
                tenantPhone,
                lease.getPropertyAddress(),
                rent,
                monthsOwed,
                owedParts[1].setScale(2, RoundingMode.HALF_UP),
                owed,
                oldestDue,
                ChronoUnit.DAYS.between(oldestDue, asOf)));
    }

    /** Due dates strictly before asOf and not after endDate. The due day itself is not overdue yet. */
    private List<LocalDate> dueDates(Lease lease, LocalDate asOf) {
        int day = lease.getPaymentDueDay() != null ? lease.getPaymentDueDay() : DEFAULT_PAYMENT_DUE_DAY;
        LocalDate start = lease.getStartDate();
        LocalDate due = start.getDayOfMonth() <= day
                ? start.withDayOfMonth(day)
                : start.withDayOfMonth(day).plusMonths(1);
        List<LocalDate> dates = new ArrayList<>();
        while (due.isBefore(asOf) && !due.isAfter(lease.getEndDate())) {
            dates.add(due);
            due = due.plusMonths(1);
        }
        return dates;
    }
}
