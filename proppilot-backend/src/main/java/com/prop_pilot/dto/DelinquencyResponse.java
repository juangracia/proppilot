package com.prop_pilot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DelinquencyResponse(
    LocalDate asOf,
    String basis,
    BigDecimal totalOwed,
    int tenantCount,
    List<DelinquencyItem> items
) {
}
