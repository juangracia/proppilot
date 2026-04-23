package com.prop_pilot.service;

import com.prop_pilot.dto.AdjustedRentResponse;

import java.time.LocalDate;

public interface RentAdjustmentService {
    AdjustedRentResponse computeAdjustedRent(Long leaseId, Long ownerId, LocalDate asOfDate);
}
