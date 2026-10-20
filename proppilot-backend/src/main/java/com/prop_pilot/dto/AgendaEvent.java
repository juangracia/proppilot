package com.prop_pilot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AgendaEvent(
    Long leaseId,
    String type,
    LocalDate date,
    long daysUntil,
    String alertLevel,
    String propertyAddress,
    String tenantName,
    BigDecimal baseRent,
    BigDecimal estimatedRent,
    String indexType,
    LocalDate indexDate
) {
}
