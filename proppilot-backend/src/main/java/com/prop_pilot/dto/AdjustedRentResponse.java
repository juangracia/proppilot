package com.prop_pilot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AdjustedRentResponse(
    Long leaseId,
    BigDecimal baseAmount,
    BigDecimal adjustedAmount,
    BigDecimal factor,
    String indexType,
    LocalDate indexDate,
    boolean hasAdjustment
) {
}
