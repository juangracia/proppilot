package com.prop_pilot.controller;

import com.prop_pilot.dto.DelinquencyResponse;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.DelinquencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/delinquency")
@Tag(name = "Delinquency", description = "Overdue rent per lease, calculated on the fly")
public class DelinquencyController {

    private final DelinquencyService delinquencyService;
    private final CurrentUserService currentUserService;

    public DelinquencyController(DelinquencyService delinquencyService, CurrentUserService currentUserService) {
        this.delinquencyService = delinquencyService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "Get delinquency", description = "Lists active leases with unpaid rent as of today, oldest debt first")
    @ApiResponse(responseCode = "200", description = "Delinquency calculated successfully")
    public ResponseEntity<DelinquencyResponse> getDelinquency() {
        Long ownerId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(delinquencyService.compute(ownerId, LocalDate.now()));
    }
}
