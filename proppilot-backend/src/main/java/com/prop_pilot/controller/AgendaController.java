package com.prop_pilot.controller;

import com.prop_pilot.dto.LeaseAgendaResponse;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.LeaseAgendaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/agenda")
@Tag(name = "Agenda", description = "Contract calendar: lease end alerts and next rent adjustments")
public class AgendaController {

    private final LeaseAgendaService leaseAgendaService;
    private final CurrentUserService currentUserService;

    public AgendaController(LeaseAgendaService leaseAgendaService, CurrentUserService currentUserService) {
        this.leaseAgendaService = leaseAgendaService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "Get contract agenda", description = "Active leases with end-of-lease alert level and next adjustment")
    @ApiResponse(responseCode = "200", description = "Agenda retrieved successfully")
    public ResponseEntity<LeaseAgendaResponse> getAgenda() {
        Long ownerId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(leaseAgendaService.getAgenda(ownerId, LocalDate.now()));
    }
}
