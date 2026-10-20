package com.prop_pilot.dto;

public record AgendaSummary(
    int expiringWithin90,
    int adjustmentsThisMonth,
    int expiredNotRenewed
) {
}
