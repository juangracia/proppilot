package com.prop_pilot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DelinquencyItem(
    Long leaseId,
    String tenantName,
    String tenantPhone,
    String propertyAddress,
    BigDecimal baseRent,
    int monthsOwed,
    BigDecimal partialAmount,
    BigDecimal amountOwed,
    LocalDate oldestUnpaidDueDate,
    long daysLate
) {
}
