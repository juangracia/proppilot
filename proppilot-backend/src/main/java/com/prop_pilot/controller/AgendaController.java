package com.prop_pilot.controller;

import com.prop_pilot.dto.AgendaResponse;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.LeaseAgendaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/agenda")
@Tag(name = "Agenda", description = "Lease end dates and next rent adjustments")
public class AgendaController {

    private final LeaseAgendaService leaseAgendaService;
    private final CurrentUserService currentUserService;

    public AgendaController(LeaseAgendaService leaseAgendaService, CurrentUserService currentUserService) {
        this.leaseAgendaService = leaseAgendaService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "Get agenda", description = "Lease end dates and rent adjustments within the next N days")
    @ApiResponse(responseCode = "200", description = "Agenda calculated successfully")
    public ResponseEntity<AgendaResponse> getAgenda(@RequestParam(defaultValue = "365") int days) {
        Long ownerId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(leaseAgendaService.compute(ownerId, LocalDate.now(), days));
    }
}
