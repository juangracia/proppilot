package com.prop_pilot.service;

import com.prop_pilot.dto.AdjustedRentResponse;
import com.prop_pilot.entity.Lease;

import java.time.LocalDate;

public interface RentAdjustmentService {
    AdjustedRentResponse computeAdjustedRent(Long leaseId, Long ownerId, LocalDate asOfDate);

    AdjustedRentResponse computeAdjustedRent(Lease lease, LocalDate asOfDate);
}
