package com.prop_pilot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DelinquencyReport(
    LocalDate asOf,
    BigDecimal totalOwed,
    int delinquentCount,
    List<DelinquentLease> items
) {}
