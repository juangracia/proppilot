package com.prop_pilot.dto;

import java.time.LocalDate;
import java.util.List;

public record AgendaResponse(
    LocalDate asOf,
    int horizonDays,
    AgendaSummary summary,
    List<AgendaEvent> events
) {
}
