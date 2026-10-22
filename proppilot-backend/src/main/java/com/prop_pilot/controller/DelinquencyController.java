package com.prop_pilot.controller;

import com.prop_pilot.dto.DelinquencyReport;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.DelinquencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/delinquency")
@Tag(name = "Delinquency", description = "Leases with overdue rent")
public class DelinquencyController {

    private final DelinquencyService delinquencyService;
    private final CurrentUserService currentUserService;

    public DelinquencyController(DelinquencyService delinquencyService, CurrentUserService currentUserService) {
        this.delinquencyService = delinquencyService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "Get delinquency report", description = "Lists active leases with overdue rent, with days overdue and amount owed")
    @ApiResponse(responseCode = "200", description = "Report retrieved successfully")
    public ResponseEntity<DelinquencyReport> getReport(
            @Parameter(description = "As of date (defaults to today)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf) {
        LocalDate date = asOf != null ? asOf : LocalDate.now();
        Long ownerId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(delinquencyService.getReport(ownerId, date));
    }
}
