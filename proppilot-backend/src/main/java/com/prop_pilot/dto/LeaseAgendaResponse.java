package com.prop_pilot.dto;

import java.time.LocalDate;
import java.util.List;

public record LeaseAgendaResponse(
    LocalDate today,
    List<String> months,
    List<LeaseAgendaItem> items,
    AlertCounts counts
) {
}
