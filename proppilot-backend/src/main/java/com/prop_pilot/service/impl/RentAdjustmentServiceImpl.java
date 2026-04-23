package com.prop_pilot.service.impl;

import com.prop_pilot.dto.AdjustedRentResult;
import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.repository.IndexValueRepository;
import com.prop_pilot.service.RentAdjustmentService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class RentAdjustmentServiceImpl implements RentAdjustmentService {

    private static final RoundingMode ROUND_MODE = RoundingMode.HALF_UP;
    private static final int SCALE = 2;
    private static final int FACTOR_SCALE = 6;
    private static final String DEFAULT_COUNTRY = "AR";

    private final IndexValueRepository indexValueRepository;
    private final Clock clock;

    public RentAdjustmentServiceImpl(IndexValueRepository indexValueRepository, Clock clock) {
        this.indexValueRepository = indexValueRepository;
        this.clock = clock;
    }

    @Override
    public AdjustedRentResult computeAdjustedRent(Lease lease) {
        long leaseId = lease.getId();
        BigDecimal baseRent = lease.getMonthlyRent();
        Lease.AdjustmentIndex adjustmentIndex = lease.getAdjustmentIndex();
        int frequency = lease.getAdjustmentFrequencyMonths() != null ? lease.getAdjustmentFrequencyMonths() : 12;
        LocalDate startDate = lease.getStartDate();
        LocalDate endDate = lease.getEndDate();
        String country = lease.getCountryCode() != null ? lease.getCountryCode() : DEFAULT_COUNTRY;

        // Case 1: NONE index — no adjustment
        if (adjustmentIndex == Lease.AdjustmentIndex.NONE) {
            return new AdjustedRentResult(
                    leaseId, baseRent, adjustmentIndex.name(), frequency,
                    false, baseRent, null, null, null, startDate, null, "INDEX_TYPE_NONE");
        }

        String indexType = adjustmentIndex.name();

        // Case 6: No data exists for this index type
        if (!indexValueRepository.existsByIndexTypeAndCountryCode(indexType, country)) {
            return new AdjustedRentResult(
                    leaseId, baseRent, indexType, frequency,
                    false, baseRent, null, null, null, startDate, null, "NO_INDEX_DATA");
        }

        LocalDate today = LocalDate.now(clock);
        long monthsSinceStart = ChronoUnit.MONTHS.between(startDate, today);

        // Case 3: Before first milestone
        if (monthsSinceStart < frequency) {
            LocalDate nextAdjustmentDate = computeNextAdjustmentDate(startDate, 0, frequency, endDate);
            return new AdjustedRentResult(
                    leaseId, baseRent, indexType, frequency,
                    true, baseRent, new BigDecimal("1.000000"), startDate, null, startDate,
                    nextAdjustmentDate, null);
        }

        // General case: compute last milestone
        long milestoneN = monthsSinceStart / frequency;
        LocalDate lastMilestone = startDate.plusMonths(milestoneN * frequency);

        // Look up base index (on-or-before startDate)
        Optional<IndexValue> baseIndexOpt = indexValueRepository
                .findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                        indexType, country, startDate);

        // Look up current index (on-or-before lastMilestone)
        Optional<IndexValue> currentIndexOpt = indexValueRepository
                .findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                        indexType, country, lastMilestone);

        // Fallback if either index row is missing
        if (baseIndexOpt.isEmpty() || currentIndexOpt.isEmpty()) {
            return new AdjustedRentResult(
                    leaseId, baseRent, indexType, frequency,
                    false, baseRent, null, null, null, startDate, null, "NO_INDEX_DATA");
        }

        IndexValue baseIndexRow = baseIndexOpt.get();
        IndexValue currentIndexRow = currentIndexOpt.get();

        BigDecimal baseValue = baseIndexRow.getValue();
        BigDecimal currentValue = currentIndexRow.getValue();

        BigDecimal factor = currentValue.divide(baseValue, FACTOR_SCALE, ROUND_MODE);
        BigDecimal adjustedRent = baseRent.multiply(factor).setScale(SCALE, ROUND_MODE);

        LocalDate nextAdjustmentDate = computeNextAdjustmentDate(startDate, milestoneN, frequency, endDate);

        return new AdjustedRentResult(
                leaseId, baseRent, indexType, frequency,
                true, adjustedRent, factor,
                currentIndexRow.getValueDate(), baseIndexRow.getValueDate(),
                startDate, nextAdjustmentDate, null);
    }

    private LocalDate computeNextAdjustmentDate(LocalDate startDate, long currentMilestoneN,
                                                 int frequency, LocalDate endDate) {
        LocalDate next = startDate.plusMonths((currentMilestoneN + 1) * frequency);
        return next.isAfter(endDate) ? null : next;
    }
}
