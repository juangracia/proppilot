package com.prop_pilot.service;

import com.prop_pilot.dto.DelinquencyResponse;

import java.time.LocalDate;

public interface DelinquencyService {
    DelinquencyResponse compute(Long ownerId, LocalDate asOf);
}
