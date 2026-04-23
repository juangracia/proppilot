package com.prop_pilot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AdjustedRentResult(
        long leaseId,
        BigDecimal baseRent,
        String adjustmentIndex,
        int adjustmentFrequencyMonths,
        boolean hasAdjustment,
        BigDecimal adjustedRent,
        BigDecimal adjustmentFactor,
        LocalDate indexReferenceDate,
        LocalDate baseIndexDate,
        LocalDate leaseStartDate,
        LocalDate nextAdjustmentDate,
        String unavailableReason
) {
}
