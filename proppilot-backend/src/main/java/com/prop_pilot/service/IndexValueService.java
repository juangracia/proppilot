package com.prop_pilot.service;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.Lease.AdjustmentIndex;

import java.time.LocalDate;
import java.util.Optional;

public interface IndexValueService {
    Optional<IndexValue> findLatestOnOrBefore(AdjustmentIndex indexType, String countryCode, LocalDate asOfDate);
}
