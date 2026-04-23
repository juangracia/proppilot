package com.prop_pilot.service;

import com.prop_pilot.dto.AdjustedRentResult;
import com.prop_pilot.entity.Lease;

public interface RentAdjustmentService {

    AdjustedRentResult computeAdjustedRent(Lease lease);
}
