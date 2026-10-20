package com.prop_pilot.service;

import com.prop_pilot.dto.AgendaResponse;

import java.time.LocalDate;

public interface LeaseAgendaService {
    AgendaResponse compute(Long ownerId, LocalDate asOf, int horizonDays);
}
