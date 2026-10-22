package com.prop_pilot.service;

import com.prop_pilot.dto.LeaseAgendaResponse;

import java.time.LocalDate;

public interface LeaseAgendaService {
    LeaseAgendaResponse getAgenda(Long ownerId, LocalDate today);
}
