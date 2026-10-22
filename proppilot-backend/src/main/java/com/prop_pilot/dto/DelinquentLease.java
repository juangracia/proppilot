package com.prop_pilot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DelinquentLease(
    Long leaseId,
    Long propertyUnitId,
    String propertyAddress,
    List<String> tenantNames,
    BigDecimal monthlyRent,
    int unpaidInstallments,
    LocalDate oldestDueDate,
    long daysOverdue,
    BigDecimal amountOwed
) {}
