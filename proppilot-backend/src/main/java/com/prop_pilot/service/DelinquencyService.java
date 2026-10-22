package com.prop_pilot.service;

import com.prop_pilot.dto.DelinquencyReport;

import java.time.LocalDate;

public interface DelinquencyService {

    DelinquencyReport getReport(Long ownerId, LocalDate asOf);
}
