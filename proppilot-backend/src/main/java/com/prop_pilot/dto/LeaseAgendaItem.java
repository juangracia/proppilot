package com.prop_pilot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record LeaseAgendaItem(
    Long leaseId,
    String propertyAddress,
    List<String> tenantNames,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal baseRent,
    long daysToEnd,
    String alertLevel,
    String adjustmentIndex,
    Integer adjustmentFrequencyMonths,
    LocalDate nextAdjustmentDate,
    List<LocalDate> adjustmentDatesInWindow,
    BigDecimal estimatedAmount,
    BigDecimal estimatedFactor,
    LocalDate indexDate,
    boolean estimateAvailable
) {
}
